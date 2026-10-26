import "server-only";

import { HttpError, isNotFoundError, serverFetch, wait } from "@/lib/api";
import {
  CancelReason,
  CustomerOrderMail,
  OrderForPayment,
  OrderLineItem,
  OrderProps,
  OrderStatus,
  PlacedOrder,
  RawOrder,
  RawOrderRefund,
  SalesOrder,
  StudioOrderMail,
  UnpaidOrder,
} from "@/contracts/server/order";
import { PaymentRecord } from "@/contracts/server/payment";
import { DeliveryFields } from "@/contracts/server/checkout";
import { LedgerAmount } from "@/contracts/server/exchangeRate";
import { Currency } from "@/contracts/shared";
import { EXCHANGE_RATES_PLN } from "@/lib/helpers/currency";
import { getWarsawDay } from "@/lib/helpers/date";
import { formatPlAmount, formatPlNumber, getLedgerAmountPln } from "@/lib/helpers/ledger";
import { exchangeRateService } from "@/lib/service/exchangeRate";
import { productService } from "@/lib/service/product";
import { isTranslatedLocale } from "@/lib/service/translation/helpers";
import {
  getLedgerMeta,
  getLedgerRemark,
  getReservationDeadline,
  isCheckoutDraft,
  isFromCheckout,
  isOrderKey,
  LOCKER_META_KEY,
  ORDER_META,
  prepareOrder,
  prepareCustomerOrderMail,
  prepareOrderForPayment,
  prepareSalesOrder,
  prepareStudioOrderMail,
  prepareUnpaidOrder,
  RESERVATION_HOURS,
} from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
// Najwięcej, ile WooCommerce oddaje na jednej stronie listy.
const SALES_PAGE_SIZE = 100;
// Jak daleko wstecz szukać zamówienia złożonego z tej samej wizyty w kasie —
// ponowione „Złóż zamówienie" przychodzi po sekundach, najwyżej minutach.
const PLACED_LOOKUP_WINDOW_MS = 60 * 60 * 1000;
// Przerwy przed kolejnymi sprawdzeniami, czy złożenie zapisało się mimo
// braku odpowiedzi — patrz markPlaced.
const PLACEMENT_CHECK_DELAYS_MS = [3_000, 6_000];
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

// Jak notatka w zamówieniu nazywa ceny w danej walucie.
const PRICES_IN_PL: Record<Currency, string> = {
  [Currency.PLN]: "w złotych",
  [Currency.EUR]: "w euro",
  [Currency.GBP]: "w funtach",
};

// Waluta płatności, gdy to nie złote — tylko wtedy jest co dopisywać.
const getForeignCurrency = (payment: PaymentRecord): Currency | null =>
  payment.currency && payment.currency !== Currency.PLN ? payment.currency : null;

// Metadane płatności zapisywane przy zamówieniu. Zamówienia księgujemy
// w złotych, więc przy płatności w euro albo funtach zostaje zapis prawdziwej
// kwoty i kursu — żeby dało się je uzgodnić ze Stripe'em.
const getPaymentMeta = (payment: PaymentRecord) => {
  const foreign = getForeignCurrency(payment);
  return [
    { key: ORDER_META.stripeIntent, value: payment.id },
    { key: ORDER_META.stripeStatus, value: payment.status },
    ...(foreign
      ? [
          { key: ORDER_META.paidCurrency, value: foreign.toUpperCase() },
          { key: ORDER_META.paidAmount, value: payment.paidTotal.toFixed(2) },
          { key: "_exchange_rate", value: EXCHANGE_RATES_PLN[foreign].toString() },
        ]
      : []),
  ];
};

// Kurs 4,30 (euro) czy 5,20 (funt) to kurs, po którym sklep wylicza ceny —
// nie ten do ewidencji. Dlatego zaraz pod nim stoi przeliczenie po kursie NBP.
const getPaymentRemarks = (
  payment: PaymentRecord,
  ledger: LedgerAmount | null
): string[] => {
  const foreign = getForeignCurrency(payment);
  if (!foreign) return [];
  return [
    `Zapłacono ${formatPlAmount(payment.paidTotal, foreign)} (ceny ` +
      `${PRICES_IN_PL[foreign]} sklep wylicza po kursie ` +
      `${formatPlNumber(EXCHANGE_RATES_PLN[foreign], 2)}).`,
    ...(ledger ? [getLedgerRemark(ledger)] : []),
  ];
};

// Płatność w euro albo funtach rozpisana do ewidencji: kwota w złotych po
// średnim kursie NBP z ostatniego dnia roboczego przed dniem zapłaty (art. 11a
// ustawy o PIT). Dzień zapłaty to dzień tego zapisu — ten sam, który
// WooCommerce zapisze jako datę zapłaty. Null dla płatności w złotych.
const getLedgerAmount = async (
  payment: PaymentRecord
): Promise<LedgerAmount | null> => {
  const foreign = getForeignCurrency(payment);
  if (!foreign) return null;

  const paidOn = getWarsawDay(new Date());
  const rate = await exchangeRateService.getRateBefore(foreign, paidOn);
  return {
    paidOn,
    currency: foreign,
    amount: payment.paidTotal,
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

  // Nazwy pozycji w języku klienta (N25). WooCommerce zapisuje w zamówieniu
  // polską nazwę z chwili zakupu — i tak zostaje dla pracowni. Klient
  // w wersji angielskiej widzi nazwę z obecnego produktu, tę samą co na jego
  // stronie (ręczne „Nazwa EN” albo tłumaczenie). Produkt usunięty ze sklepu
  // albo awaria zostawiają nazwę z zamówienia.
  private async localizeItems(
    items: OrderLineItem[],
    locale?: string
  ): Promise<OrderLineItem[]> {
    if (!isTranslatedLocale(locale)) return items;

    const ids = [...new Set(items.flatMap((item) => (item.productId ? [item.productId] : [])))];
    try {
      const products = await productService.getProductsByIds(ids, locale);
      const names = new Map(products.map((product) => [product.id, product.name]));
      return items.map((item) => ({
        ...item,
        name: (item.productId && names.get(item.productId)) || item.name,
      }));
    } catch (error) {
      console.error("Order item names translation failed:", error);
      return items;
    }
  }

  private async localizeOrder(order: OrderProps, locale?: string): Promise<OrderProps> {
    return { ...order, items: await this.localizeItems(order.items, locale) };
  }

  async getCustomerOrders(customerId: number, locale?: string): Promise<OrderProps[]> {
    const raw = await this.wcFetch<RawOrder[]>(
      `orders?customer=${customerId}&per_page=50&orderby=date&order=desc`
    );
    const orders = raw.filter((order) => !isCheckoutDraft(order)).map(prepareOrder);
    return Promise.all(orders.map((order) => this.localizeOrder(order, locale)));
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

  // Jedno zamówienie dla kogoś, kto ma do niego link z maila: numer i klucz
  // zamówienia zamiast logowania. Null, gdy zamówienia nie ma, klucz się nie
  // zgadza albo to wciąż szkic z kasy; awaria WordPressa leci dalej.
  async getOrderByKey(
    orderId: number,
    key: string,
    locale?: string
  ): Promise<OrderProps | null> {
    try {
      const raw = await this.wcFetch<RawOrder>(`orders/${orderId}`);
      if (!isOrderKey(raw, key) || isCheckoutDraft(raw)) return null;
      return await this.localizeOrder(prepareOrder(raw), locale);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  // Złożone, nieopłacone zamówienia z rezerwacją — do przypomnień i do
  // anulowania po terminie. Wszystkie naraz: u pracowni to garstka, a sto na
  // stronie to sufit WooCommerce. Zamówienia sprzed rezerwacji (bez terminu)
  // odpadają w prepareUnpaidOrder.
  async getReservedOrders(): Promise<UnpaidOrder[]> {
    const raw = await this.wcFetch<RawOrder[]>(
      `orders?status=${OrderStatus.OnHold}&per_page=100&orderby=date&order=asc`
    );
    const orders = raw
      .map(prepareUnpaidOrder)
      .filter((order): order is UnpaidOrder => order !== null);

    // Przypomnienie idzie w języku klienta, więc i nazwy. Po kolei — patrz
    // ReservationService: serwer WP nie znosi tłoku.
    const localized: UnpaidOrder[] = [];
    for (const order of orders) {
      localized.push({ ...order, items: await this.localizeItems(order.items, order.locale) });
    }
    return localized;
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

  // Ile przypomnień o zapłacie już wyszło — liczba, nie znacznik, bo
  // przypomnienia są dwa (po 12 i po 24 h).
  async markRemindersSent(orderId: number, count: number): Promise<void> {
    await this.updateMeta(orderId, [
      { key: ORDER_META.reminders, value: count.toString() },
    ]);
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

  // Złożenie zamówienia: szkic z kasy staje się zamówieniem „wstrzymanym"
  // (on-hold) — tak WooCommerce oznacza „czeka na wpłatę, towar odłożony".
  // To nie tylko nazwa: przy wejściu w ten stan WooCommerce SAM zdejmuje
  // sztukę z magazynu (i zapamiętuje, że to zrobił), przy anulowaniu SAM ją
  // oddaje, a przy późniejszej zapłacie nie zdejmuje jej drugi raz. Ze szkicu
  // prosto do on-hold, bo przejście przez „oczekuje na płatność" oddałoby
  // sztukę z powrotem. ‼️ Z tego samego powodu zamówienie złożone nie może już
  // nigdy wrócić do „oczekuje na płatność".
  // Zwraca termin rezerwacji (ISO). Płatności jeszcze nie ma — kasa zakłada ją
  // dla złożonego zamówienia (CheckoutService.getOrderPayment).
  //
  // Brak odpowiedzi nie znaczy, że zapisu nie ma. Sprawdzone 2026-10-19 testem
  // zamówień: WordPress zapisywał złożenie dłużej niż limit 10 s, klient
  // zobaczył „Błąd połączenia", a zamówienie było złożone i praca
  // zarezerwowana — tylko bez maila „złożone". Dlatego po zerwanym połączeniu
  // albo błędzie serwera najpierw pytamy WooCommerce, co zapisał. Odmowa (4xx)
  // znaczy, że nic się nie zapisało.
  async markPlaced(orderId: number): Promise<string> {
    const reservedUntil = getReservationDeadline(new Date());
    try {
      await this.wcFetch(`orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: OrderStatus.OnHold,
          meta_data: [{ key: ORDER_META.reservedUntil, value: reservedUntil }],
        }),
      });
    } catch (error) {
      if (error instanceof HttpError && error.status < 500) throw error;
      if (!(await this.isPlaced(orderId))) throw error;
      console.warn(`Order ${orderId}: placed although WooCommerce did not answer:`, error);
    }
    await this.addPrivateNotes(orderId, [
      `Zamówienie złożone, czeka na wpłatę — praca zarezerwowana na ` +
        `${RESERVATION_HOURS} h. Bez wpłaty sklep sam je anuluje. Nie wysyłać ` +
        `przed wpłatą.`,
    ]);
    return reservedUntil;
  }

  // Czy zamówienie jest już złożone (on-hold). WordPress może jeszcze kończyć
  // zapis, na który nie doczekaliśmy się odpowiedzi, więc pytamy kilka razy
  // z przerwami. Awaria przy sprawdzaniu liczy się jak „nie".
  private async isPlaced(orderId: number): Promise<boolean> {
    for (const delay of PLACEMENT_CHECK_DELAYS_MS) {
      await wait(delay);
      try {
        const order = await this.wcFetch<Pick<RawOrder, "status">>(
          `orders/${orderId}?_fields=status`
        );
        if (order.status === OrderStatus.OnHold) return true;
      } catch (error) {
        console.error(`Order ${orderId}: placement check failed:`, error);
      }
    }
    return false;
  }

  // Zamówienie złożone już z tej samej wizyty w kasie (patrz
  // PlaceOrderInput.checkoutId) — szukane wśród świeżych złożonych zamówień na
  // ten sam adres e-mail. Null, gdy nie ma; awaria też daje null, bo wtedy
  // i złożenie nowego najpewniej się nie uda.
  async findPlacedByCheckout(
    email: string,
    checkoutId: string
  ): Promise<PlacedOrder | null> {
    const after = new Date(Date.now() - PLACED_LOOKUP_WINDOW_MS).toISOString();
    try {
      const recent = await this.wcFetch<RawOrder[]>(
        `orders?status=${OrderStatus.OnHold}&search=${encodeURIComponent(email)}` +
          `&after=${encodeURIComponent(after)}&per_page=20&_fields=id,order_key,meta_data`
      );
      const match = recent.find((raw) => isFromCheckout(raw, checkoutId));
      return match ? { id: match.id, key: match.order_key ?? "" } : null;
    } catch (error) {
      console.error("Placed order lookup failed:", error);
      return null;
    }
  }

  // Poprawka dostawy w złożonym, nieopłaconym zamówieniu („Zapisz zmiany"
  // w kasie). Linia wysyłki jest PODMIENIANA po numerze — bez numeru
  // WooCommerce dopisałby drugą. Przy zmianie linii WooCommerce sam przelicza
  // sumę zamówienia. Magda dostaje notatkę, bo mail „złożone" pokazuje dane
  // sprzed poprawki.
  async updateDelivery(
    orderId: number,
    fields: DeliveryFields,
    shippingLineId: number | null
  ): Promise<void> {
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        billing: fields.billing,
        shipping: fields.shipping,
        shipping_lines: [
          { ...(shippingLineId ? { id: shippingLineId } : {}), ...fields.shippingLine },
        ],
        customer_note: fields.customerNote,
        meta_data: [{ key: LOCKER_META_KEY, value: fields.lockerCode ?? "" }],
      }),
    });
    await this.addPrivateNotes(orderId, [
      "Klient poprawił dane dostawy przed zapłatą. Mail „złożone” pokazuje " +
        "dane sprzed poprawki — wysyłać na adres z zamówienia.",
    ]);
  }

  // Płatność, którą klient opłaca to zamówienie — patrz ORDER_META.paymentIntent.
  async setPaymentIntent(orderId: number, paymentIntentId: string): Promise<void> {
    await this.updateMeta(orderId, [
      { key: ORDER_META.paymentIntent, value: paymentIntentId },
    ]);
  }

  // Anulowanie. WooCommerce sam oddaje wtedy sztukę do magazynu (patrz
  // markPlaced). Notatka mówi Magdzie, dlaczego.
  // Powód idzie w tym samym zapisie co stan: webhook o anulowaniu musi od
  // razu wiedzieć, że to sklep anulował i mail do klienta już jest w drodze.
  async cancel(orderId: number, reason: CancelReason, note: string): Promise<void> {
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: OrderStatus.Cancelled,
        meta_data: [{ key: ORDER_META.cancelReason, value: reason }],
      }),
    });
    await this.addPrivateNotes(orderId, [note]);
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

  // Zapłacone. Dwie drogi, bo WooCommerce przez API przyjmuje `set_paid`
  // WYŁĄCZNIE od zamówień „oczekujących na płatność" (i „nieudanych") —
  // przy każdym innym stanie po cichu go ignoruje.
  //
  // - Szkic i „oczekuje na płatność" (zamówienia sprzed 2026-10-08): `set_paid`,
  //   czyli `payment_complete()` — stan „w realizacji", data zapłaty, numer
  //   transakcji, zdjęcie sztuki z magazynu. Stanu nie ustawiamy obok ręcznie:
  //   przy stanie już zmienionym `payment_complete()` uznałby, że nie ma nic
  //   do roboty.
  // - Złożone (on-hold) i anulowane: wprost stan „w realizacji" z numerem
  //   transakcji. Datę zapłaty WooCommerce stawia sam przy przejściu w ten
  //   stan. Sztuki złożone zamówienie już nie zdejmuje (zrobiło to przy
  //   złożeniu — patrz markPlaced), a anulowane zdejmuje ją na nowo.
  //
  // Kwotę i walutę bierze ze Stripe'a, nie z żądania. Kurs NBP do ewidencji
  // pobiera się w tym samym czasie co wyjście ze szkicu, więc domknięcie
  // na niego nie czeka dłużej, niż musi — a gdy NBP nie odpowie, zapłata
  // i tak się zapisze, tylko notatka poprosi o ręczne przeliczenie.
  async markPaid(
    orderId: number,
    status: OrderStatus,
    payment: PaymentRecord,
    remarks: string[] = [],
    methodLabel: string | null = null
  ): Promise<void> {
    const [ledger] = await Promise.all([
      getLedgerAmount(payment),
      this.leaveDraft(orderId, status),
    ]);
    const viaStatus =
      status === OrderStatus.OnHold || status === OrderStatus.Cancelled;
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...(viaStatus ? { status: OrderStatus.Processing } : { set_paid: true }),
        ...(methodLabel ? { payment_method_title: methodLabel } : {}),
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
    payment: PaymentRecord,
    methodLabel: string | null = null
  ): Promise<void> {
    await this.leaveDraft(orderId, status);
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: OrderStatus.OnHold,
        ...(methodLabel ? { payment_method_title: methodLabel } : {}),
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
      const mail = prepareCustomerOrderMail(await this.wcFetch<RawOrder>(`orders/${orderId}`));
      if (!mail) return null;
      // Mail do klienta idzie w jego języku — nazwy pozycji też (N25).
      const items = await this.localizeItems(mail.amounts.items, mail.preferences.locale);
      return { ...mail, amounts: { ...mail.amounts, items } };
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
