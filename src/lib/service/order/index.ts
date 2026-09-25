import "server-only";

import { serverFetch } from "@/lib/api";
import {
  OrderForPayment,
  OrderProps,
  OrderStatus,
  RawOrder,
  UnpaidOrder,
} from "@/contracts/server/order";
import { PaymentRecord } from "@/contracts/server/payment";
import { Currency } from "@/contracts/shared";
import { EXCHANGE_RATE_PLN_PER_EUR } from "@/lib/helpers/currency";
import {
  hasReminderBeenSent,
  isCheckoutDraft,
  prepareOrder,
  prepareOrderForPayment,
  prepareUnpaidOrder,
  REMINDER_SENT_META_KEY,
} from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
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
        { key: "_paid_currency", value: "EUR" },
        { key: "_paid_amount", value: payment.paidTotal.toFixed(2) },
        { key: "_exchange_rate", value: EXCHANGE_RATE_PLN_PER_EUR.toString() },
      ]
    : []),
];

const getPaymentRemarks = (payment: PaymentRecord): string[] =>
  payment.currency === Currency.EUR
    ? [
        `Zapłacono ${payment.paidTotal.toFixed(2)} € (kurs ${EXCHANGE_RATE_PLN_PER_EUR}).`,
      ]
    : [];

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
    if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
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
  // więc właściciela sprawdzamy tutaj, a nie w widoku.
  async getCustomerOrder(
    customerId: number,
    orderId: number
  ): Promise<OrderProps | null> {
    try {
      const raw = await this.wcFetch<RawOrder>(`orders/${orderId}`);
      if (raw.customer_id !== customerId || isCheckoutDraft(raw)) return null;
      return prepareOrder(raw);
    } catch {
      return null;
    }
  }

  // Zamówienia, za które nie zapłacono, starsze niż `olderThan` i nie starsze
  // niż `notOlderThan` — czyli takie, którym warto przypomnieć, a nie takie
  // sprzed pół roku. Te z zapisanym przypomnieniem odpadają.
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
      .filter((order) => !hasReminderBeenSent(order))
      .map(prepareUnpaidOrder)
      .filter((order): order is UnpaidOrder => order !== null);
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

  // Zamówienie, do którego należy płatność. Null, gdy go nie ma — np. Magda
  // skasowała szkic albo WooCommerce go wysprzątał.
  async getOrderForPayment(orderId: number): Promise<OrderForPayment | null> {
    try {
      return prepareOrderForPayment(
        await this.wcFetch<RawOrder>(`orders/${orderId}`)
      );
    } catch (error) {
      console.error(`Order ${orderId}: lookup for payment failed:`, error);
      return null;
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
  // Kwotę i walutę bierze ze Stripe'a, nie z żądania.
  async markPaid(
    orderId: number,
    status: OrderStatus,
    payment: PaymentRecord,
    remarks: string[] = []
  ): Promise<void> {
    await this.leaveDraft(orderId, status);
    await this.wcFetch(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        set_paid: true,
        transaction_id: payment.id,
        meta_data: getPaymentMeta(payment),
      }),
    });
    await this.addPrivateNotes(orderId, [...getPaymentRemarks(payment), ...remarks]);
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
