import Stripe from "stripe";
import { PaymentRecord, PaymentStatus } from "@/contracts/server/payment";
import { PlacedOrder } from "@/contracts/server/order";
import { Currency } from "@/contracts/shared";

// Klucze metadanych płatności w Stripe. Trzy pierwsze zapisuje kasa przy
// tworzeniu płatności, dwa ostatnie — zamówienie, które z niej powstało.
export const PAYMENT_META = {
  cart: "cart",
  country: "country",
  shipping: "shipping",
  orderId: "orderId",
  orderKey: "orderKey",
} as const;

const getPaidCurrency = (value: string): Currency | null =>
  value === Currency.PLN || value === Currency.EUR ? value : null;

const getPlacedOrder = (metadata: Stripe.Metadata): PlacedOrder | null => {
  const id = Number(metadata[PAYMENT_META.orderId]);
  const key = metadata[PAYMENT_META.orderKey];
  return Number.isInteger(id) && id > 0 && key ? { id, key } : null;
};

const getPaymentStatus = (intent: Stripe.PaymentIntent): PaymentStatus => {
  if (intent.status === "succeeded") return PaymentStatus.Succeeded;
  return intent.status === "processing"
    ? PaymentStatus.Processing
    : PaymentStatus.Unusable;
};

export const preparePayment = (intent: Stripe.PaymentIntent): PaymentRecord => ({
  id: intent.id,
  status: getPaymentStatus(intent),
  currency: getPaidCurrency(intent.currency),
  paidTotal: (intent.amount_received || intent.amount) / 100,
  cart: intent.metadata[PAYMENT_META.cart] ?? "",
  country: intent.metadata[PAYMENT_META.country] ?? "",
  order: getPlacedOrder(intent.metadata),
});

// Czy ta płatność jest za dokładnie ten koszyk i ten kraj. Pusty zapis koszyka
// odpada z automatu: płatność bez naszych metadanych to płatność, której kasa
// nie wyceniała.
export const isPaymentFor = (
  payment: PaymentRecord,
  fingerprint: string,
  country: string
): boolean =>
  payment.status !== PaymentStatus.Unusable &&
  payment.currency !== null &&
  !!payment.cart &&
  payment.cart === fingerprint &&
  payment.country === country;
