import "server-only";

import { serverFetch } from "@/lib/api";
import {
  OrderProps,
  RawOrder,
  UnpaidOrder,
} from "@/contracts/server/order";
import { PaymentRecord } from "@/contracts/server/payment";
import { Currency } from "@/contracts/shared";
import { EXCHANGE_RATE_PLN_PER_EUR } from "@/lib/helpers/currency";
import {
  hasReminderBeenSent,
  prepareOrder,
  prepareUnpaidOrder,
  REMINDER_SENT_META_KEY,
} from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

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
    return raw.map(prepareOrder);
  }

  // Jedno zamówienie, ale WYŁĄCZNIE gdy należy do tego klienta. Numer
  // zamówienia w adresie nie może wystarczyć do obejrzenia cudzych zakupów,
  // więc właściciela sprawdzamy tutaj, a nie w widoku.
  async getCustomerOrder(
    customerId: number,
    orderId: number
  ): Promise<OrderProps | null> {
    try {
      const raw = await this.wcFetch<RawOrder & { customer_id?: number }>(
        `orders/${orderId}`
      );
      if (raw.customer_id !== customerId) return null;
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

  // Domknięcie zapłaty za zamówienie, które już istniało. Kwotę i walutę bierze
  // ze Stripe'a, nie z żądania — dokładnie jak przy zamówieniu z kasy.
  async markPaid(orderId: number, payment: PaymentRecord): Promise<OrderProps> {
    const paidInEur = payment.currency === Currency.EUR;

    const raw = await this.wcFetch<RawOrder>(`orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({
        set_paid: true,
        status: "processing",
        meta_data: [
          { key: "_stripe_payment_intent", value: payment.id },
          { key: "_stripe_payment_status", value: payment.status },
          ...(paidInEur
            ? [
                { key: "_paid_currency", value: "EUR" },
                { key: "_paid_amount", value: payment.paidTotal.toFixed(2) },
                {
                  key: "_exchange_rate",
                  value: EXCHANGE_RATE_PLN_PER_EUR.toString(),
                },
              ]
            : []),
        ],
      }),
    });

    return prepareOrder(raw);
  }
}

export const orderService = OrderService.getInstance();
