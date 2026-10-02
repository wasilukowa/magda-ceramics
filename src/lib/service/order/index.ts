import "server-only";

import { HttpError, isNotFoundError, serverFetch } from "@/lib/api";
import {
  CustomerOrderMail,
  OrderForPayment,
  OrderProps,
  OrderStatus,
  RawOrder,
  RawOrderRefund,
  SalesOrder,
  StudioOrderMail,
  UnpaidOrder,
} from "@/contracts/server/order";
import { PaymentRecord } from "@/contracts/server/payment";
import { LedgerAmount } from "@/contracts/server/exchangeRate";
import { Currency } from "@/contracts/shared";
import { EXCHANGE_RATE_PLN_PER_EUR } from "@/lib/helpers/currency";
import { getWarsawDay } from "@/lib/helpers/date";
import { formatPlNumber, getLedgerAmountPln } from "@/lib/helpers/ledger";
import { exchangeRateService } from "@/lib/service/exchangeRate";
import {
  getLedgerMeta,
  getLedgerRemark,
  hasCustomerAccount,
  hasReminderBeenSent,
  isCheckoutDraft,
  ORDER_META,
  prepareOrder,
  prepareCustomerOrderMail,
  prepareOrderForPayment,
  prepareSalesOrder,
  prepareStudioOrderMail,
  prepareUnpaidOrder,
  REMINDER_SENT_META_KEY,
} from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
// Najwięcej, ile WooCommerce oddaje na jednej stronie listy.
const SALES_PAGE_SIZE = 100;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

// Metadane płatności zapisywane przy zamówieniu. Zamówienia księgujemy
// w złotych, więc przy płatności w euro zostaje zapis prawdziwej kwoty i kursu
// — żeby dało się je uzgodnić ze Stripe'em.
const getPaymentMeta = (payment: PaymentRecord) => [
  { key: "_stripe_payment_intent", value: payment.id },
  { key: "_stripe_payment_status", value: payment.status },
  ...(payment.currency === Currency.EUR
    ? [
        { key: ORDER_META.paidCurrency, value: "EUR" },
        { key: ORDER_META.paidAmount, value: payment.paidTotal.toFixed(2) },
        { key: "_exchange_rate", value: EXCHANGE_RATE_PLN_PER_EUR.toString() },
      ]
    : []),
];

// Kurs 4,3 to kurs, po którym sklep wylicza ceny w euro — nie ten do
// ewidencji. Dlatego zaraz pod nim stoi przeliczenie po kursie NBP.
const getPaymentRemarks = (
  payment: PaymentRecord,
  ledger: LedgerAmount | null
): string[] =>
  payment.currency === Currency.EUR
    ? [
        `Zapłacono ${formatPlNumber(payment.paidTotal, 2)} € (ceny w euro sklep ` +
          `wylicza po kursie ${formatPlNumber(EXCHANGE_RATE_PLN_PER_EUR, 2)}).`,
        ...(ledger ? [getLedgerRemark(ledger)] : []),
      ]
    : [];

// Płatność w euro rozpisana do ewidencji: kwota w złotych po średnim kursie
// NBP z ostatniego dnia roboczego przed dniem zapłaty (art. 11a ustawy
// o PIT). Dzień zapłaty to dzień tego zapisu — ten sam, który WooCommerce
// zapisze jako datę zapłaty. Null dla płatności w złotych.
const getLedgerAmount = async (
  payment: PaymentRecord
): Promise<LedgerAmount | null> => {
  if (payment.currency !== Currency.EUR) return null;

  const paidOn = getWarsawDay(new Date());
  const rate = await exchangeRateService.getEurRateBefore(paidOn);
  return {
    paidOn,
    amountEur: payment.paidTotal,
    conversion: rate
      ? { rate, amountPln: getLedgerAmountPln(payment.paidTotal, rate.mid) }
      : null,
  };
};

// Zamówienia — czytane i domykane. Wcześniej mieszkały w CustomerService, ale
// nie wszystkie należą do jednego klienta: przypomnienia o zapłacie przeglądają
// zamówienia całej pracowni, więc to własna domena.
class OrderService {
  private static instance: OrderService;
  private readonly authHeader: string;

  private constructor() {
    this.authHeader = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  }

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  private async wcFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await serverFetch(`${WP_URL}/wp-json/wc/v3/${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Basic ${this.authHeader}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
      cache: "no-store",
    });
    if (!res.ok) throw new HttpError(res.status, `WooCommerce API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getCustomerOrders(customerId: number): Promise<OrderProps[]> {
    const raw = await this.wcFetch<RawOrder[]>(
      `orders?customer=${customerId}&per_page=50&orderby=date&order=desc`
    );
    return raw.filter((order) => !isCheckoutDraft(order)).map(prepareOrder);
  }

  // Jedno zamówienie, ale WYŁĄCZNIE gdy należy do tego klienta. Numer
  // zamówienia w adresie nie może wystarczyć do obejrzenia cudzych zakupów,
  // więc właściciela sprawdzamy tutaj, a nie w widoku. Null, gdy zamówienia
  // nie ma albo jest cudze; awaria WordPressa leci dalej, żeby klient zobaczył
  // „coś poszło nie tak", a nie „takiego zamówienia nie ma".
  async getCustomerOrder(
    customerId: number,
    orderId: number
  ): Promise<OrderProps | null> {
    try {
      const raw = await this.wcFetch<RawOrder>(`orders/${orderId}`);
      if (raw.customer_id !== customerId || isCheckoutDraft(raw)) return null;
      return prepareOrder(raw);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  // Zamówienia, za które nie zapłacono, starsze niż `olderThan` i nie starsze
  // niż `notOlderThan` — czyli takie, którym warto przypomnieć, a nie takie
  // sprzed pół roku. Te z zapisanym przypomnieniem odpadają, podobnie jak
  // zamówienia gości: przycisk w przypomnieniu prowadzi do „Zapłać” w koncie
  // klienta, a gość bez logowania dostałby tam „nie znaleziono”.
  async getOrdersAwaitingReminder({
    olderThan,
    notOlderThan,
  }: {
    olderThan: Date;
    notOlderThan: Date;
  }): Promise<UnpaidOrder[]> {
    const raw = await this.wcFetch<RawOrder[]>(
      `orders?status=pending,failed&per_page=50&orderby=date&order=desc` +
        `&before=${olderThan.toISOString()}&after=${notOlderThan.toISOString()}`
    );

    return raw
      .filter((order) => hasCustomerAccount(order) && !hasReminderBeenSent(order))
      .map(prepareUnpaidOrder)
      .filter((order): order is UnpaidOrder => order !== null);
  }

  // Opłacone zamówienia do zestawienia sprzedaży: wszystkie zmienione od
  // podanej chwili (UTC). Zapłata i zwrot zmieniają zamówienie, więc nic, co
  // wydarzyło się od tej chwili, nie umknie — a o tym, do którego miesiąca
  // wpis należy, decyduje dopiero zestawienie. Zwroty WooCommerce trzyma
  // osobno, z własną datą. Wszystko po kolei, nie równolegle: serwer WP
  // pracowni nie znosi tłoku, a zestawienie nigdzie się nie spieszy.
  async getSalesOrders(modifiedAfter: string): Promise<SalesOrder[]> {
    const raw: RawOrder[] = [];
    for (let page = 1; ; page++) {
      const batch = await this.wcFetch<RawOrder[]>(
        `orders?status=any&modified_after=${modifiedAfter}&dates_are_gmt=true` +
          `&orderby=id&order=asc&per_page=${SALES_PAGE_SIZE}&page=${page}`
      );
      raw.push(...batch);
      if (batch.length < SALES_PAGE_SIZE) break;
    }

    const orders: SalesOrder[] = [];
    for (const order of raw) {
      if (!order.date_paid_gmt) continue;
      const refunds = order.refunds?.length
        ? await this.wcFetch<RawOrderRefund[]>(`orders/${order.id}/refunds`)
        : [];
      const prepared = prepareSalesOrder(order, refunds);
      if (prepared) orders.push(prepared);
    }
    return orders;
  }

  async markReminderSent(orderId: number): Promise<void> {
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        meta_data: [
          { key: REMINDER_SENT_META_KEY, value: new Date().toISOString() },
        ],
      }),
    });
  }

  // Zamówienie, do którego należy płatność. Null WYŁĄCZNIE wtedy, gdy
  // WooCommerce mówi, że go nie ma (404) — np. Magda skasowała szkic.
  // Każdy inny błąd leci dalej. To ważne: webhook Stripe'a odpowiada na
  // błąd kodem 500 i Stripe ponawia zdarzenie przez kilka dni, a na null —
  // kodem 200 i Stripe uznaje sprawę za załatwioną. Wcześniej chwilowa
  // awaria WordPressa w tej jednej sekundzie zostawiała opłacone zamówienie
  // jako niewidoczny szkic, bez maila do klienta i bez śladu u Magdy.
  async getOrderForPayment(orderId: number): Promise<OrderForPayment | null> {
    try {
      return prepareOrderForPayment(
        await this.wcFetch<RawOrder>(`orders/${orderId}`)
      );
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  // Szkic z kasy staje się najpierw zwykłym zamówieniem „oczekuje na płatność".
  // To nie formalność: maile WooCommerce — „nowe zamówienie" do Magdy
  // i potwierdzenie do klienta — wychodzą przy przejściu Z tego stanu. Prosto
  // ze szkicu nie wyszłyby wcale.
  private async leaveDraft(orderId: number, status: OrderStatus): Promise<void> {
    if (status !== OrderStatus.CheckoutDraft) return;
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({ status: OrderStatus.Pending }),
    });
  }

  // Zapłacone. `set_paid` to w WooCommerce `payment_complete()`: zmienia stan
  // na „w realizacji", zapisuje datę zapłaty i numer transakcji, zdejmuje
  // sztukę z magazynu i wysyła maile. Stanu nie ustawiamy obok ręcznie — przy
  // stanie już zmienionym `payment_complete()` uznałby, że nie ma nic do roboty.
  // Kwotę i walutę bierze ze Stripe'a, nie z żądania. Kurs NBP do ewidencji
  // pobiera się w tym samym czasie co wyjście ze szkicu, więc domknięcie
  // na niego nie czeka dłużej, niż musi — a gdy NBP nie odpowie, zapłata
  // i tak się zapisze, tylko notatka poprosi o ręczne przeliczenie.
  async markPaid(
    orderId: number,
    status: OrderStatus,
    payment: PaymentRecord,
    remarks: string[] = []
  ): Promise<void> {
    const [ledger] = await Promise.all([
      getLedgerAmount(payment),
      this.leaveDraft(orderId, status),
    ]);
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        set_paid: true,
        transaction_id: payment.id,
        meta_data: [...getPaymentMeta(payment), ...getLedgerMeta(ledger)],
      }),
    });
    await this.addPrivateNotes(orderId, [
      ...getPaymentRemarks(payment, ledger),
      ...remarks,
    ]);
  }

  // Metoda odroczona (np. Klarna): pieniędzy jeszcze nie ma, ale zamówienie
  // musi już być widać — wstrzymane, żeby nikt go nie wysłał przed czasem.
  // Webhook domknie je, gdy Stripe potwierdzi płatność.
  async markAwaitingConfirmation(
    orderId: number,
    status: OrderStatus,
    payment: PaymentRecord
  ): Promise<void> {
    await this.leaveDraft(orderId, status);
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: OrderStatus.OnHold,
        meta_data: getPaymentMeta(payment),
      }),
    });
    await this.addPrivateNotes(orderId, [
      "Stripe jeszcze potwierdza tę płatność (metoda odroczona). Zamówienie " +
        "czeka wstrzymane i samo zmieni się na opłacone, gdy pieniądze dojdą. " +
        "Nie wysyłać wcześniej.",
    ]);
  }

  // Zamówienie w ujęciu maila do klienta. Null, gdy go nie ma (404) albo nie ma
  // adresu e-mail; awaria WordPressa leci dalej.
  async getCustomerOrderMail(orderId: number): Promise<CustomerOrderMail | null> {
    try {
      return prepareCustomerOrderMail(await this.wcFetch<RawOrder>(`orders/${orderId}`));
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  // Zamówienie w ujęciu maila „nowe zamówienie" do pracowni. Null, gdy go nie
  // ma (404); awaria WordPressa leci dalej.
  async getStudioOrderMail(orderId: number): Promise<StudioOrderMail | null> {
    try {
      return prepareStudioOrderMail(await this.wcFetch<RawOrder>(`orders/${orderId}`));
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  // Zapis danych przy zamówieniu (np. znacznika wysłanego maila).
  async updateMeta(
    orderId: number,
    meta: { key: string; value: string }[]
  ): Promise<void> {
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({ meta_data: meta }),
    });
  }

  async addPrivateNote(orderId: number, note: string): Promise<void> {
    await this.addPrivateNotes(orderId, [note]);
  }

  // Notatki widoczne wyłącznie dla Magdy w panelu. Uwagi w rodzaju „ta praca
  // była już sprzedana" nie mogą trafić do maila klienta, a pole
  // `customer_note` WooCommerce wkleja właśnie tam. Nieudany zapis notatki nie
  // cofa płatności, więc tylko go logujemy.
  private async addPrivateNotes(orderId: number, notes: string[]): Promise<void> {
    for (const note of notes) {
      try {
        await this.wcFetch(`orders/${orderId}/notes`, {
          method: "POST",
          body: JSON.stringify({ note, customer_note: false }),
        });
      } catch (error) {
        console.error(`Order ${orderId}: note not saved:`, error);
      }
    }
  }
}

export const orderService = OrderService.getInstance();
