import {
  OrderForPayment,
  OrderProps,
  OrderStatus,
  PAYABLE_STATUSES,
  RawOrder,
  UnpaidOrder,
} from "@/contracts/server/order";
import { routing } from "@/i18n/routing";

// Meta, którym zaznaczamy wysłane przypomnienie o zapłacie. Dzięki temu drugi
// przebieg zadania nie napisze do tej samej osoby po raz drugi.
export const REMINDER_SENT_META_KEY = "_mc_payment_reminder_sent";

export const toOrderStatus = (status: string): OrderStatus =>
  Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : OrderStatus.Pending;

export const isPayableStatus = (status: OrderStatus): boolean =>
  PAYABLE_STATUSES.includes(status as (typeof PAYABLE_STATUSES)[number]);

// Szkic, który kasa zapisała tuż przed płatnością. Klient go nie widzi:
// zamówieniem staje się dopiero wtedy, gdy płatność je domknie.
export const isCheckoutDraft = (raw: RawOrder): boolean =>
  raw.status === OrderStatus.CheckoutDraft;

export const prepareOrderForPayment = (raw: RawOrder): OrderForPayment => ({
  id: raw.id,
  key: raw.order_key ?? "",
  status: toOrderStatus(raw.status),
  items: (raw.line_items ?? []).flatMap((item) =>
    item.product_id ? [{ id: item.product_id, quantity: item.quantity }] : []
  ),
});

export const prepareOrder = (raw: RawOrder): OrderProps => {
  const status = toOrderStatus(raw.status);

  return {
    id: raw.id,
    number: raw.number,
    status,
    dateCreated: raw.date_created,
    total: raw.total,
    currency: raw.currency,
    items: (raw.line_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      total: item.total,
    })),
    payable: isPayableStatus(status),
  };
};

// Języka klient nigdzie nie podaje, a mail musi w jakimś wyjść. Kraj adresu
// jest najbliższą prawdy wskazówką, jaką mamy: Polska → polski, reszta →
// język domyślny sklepu.
const getOrderLocale = (country: string | undefined): string =>
  country === "PL" ? "pl" : routing.defaultLocale;

export const hasReminderBeenSent = (raw: RawOrder): boolean =>
  Boolean(
    raw.meta_data?.find((meta) => meta.key === REMINDER_SENT_META_KEY)?.value
  );

export const prepareUnpaidOrder = (raw: RawOrder): UnpaidOrder | null => {
  const email = raw.billing?.email;
  if (!email) return null;

  return {
    id: raw.id,
    number: raw.number,
    total: raw.total,
    currency: raw.currency,
    email,
    firstName: raw.billing?.first_name ?? "",
    locale: getOrderLocale(raw.billing?.country),
    items: (raw.line_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      total: item.total,
    })),
  };
};
