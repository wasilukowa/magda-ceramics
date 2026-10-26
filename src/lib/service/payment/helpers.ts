import Stripe from "stripe";
import { PaymentRecord, PaymentStatus } from "@/contracts/server/payment";
import { Currency } from "@/contracts/shared";
import { isCurrency } from "@/utility";

// Klucze metadanych płatności w Stripe: numer i klucz zamówienia, DLA którego
// płatność powstała (PaymentService.getOrderIntent). Po kluczu poznajemy
// płatność, którą wolno domknąć bez sesji klienta (np. z webhooka). Płatności
// sprzed 2026-10-12 mają jeszcze zapis koszyka, kraju i wysyłki z dawnej
// wyceny w kasie — dziś nikt ich nie czyta.
export const PAYMENT_META = {
  orderId: "orderId",
  orderKey: "orderKey",
} as const;

// Metoda płatności w panelu WooCommerce („Płatność przez …”). Zanim klient
// zapłaci, nie wiadomo jeszcze, czym zapłaci — stąd samo „Stripe”. Potem
// nazwa metody ze Stripe'a; Apple Pay i Google Pay to w Stripe karta
// z portfelem, więc rozpoznaje je pole `wallet`. Metoda spoza listy zostaje
// pod swoją nazwą ze Stripe'a.
export const UNKNOWN_PAYMENT_METHOD_LABEL = "Stripe";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Karta",
  blik: "BLIK",
  klarna: "Klarna",
  link: "Link",
  p24: "Przelewy24",
};

const CARD_WALLET_LABELS: Record<string, string> = {
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  link: "Link",
};

export const getPaymentMethodLabel = (method: Stripe.PaymentMethod): string => {
  const wallet = method.type === "card" ? method.card?.wallet?.type : undefined;
  return (
    (wallet && CARD_WALLET_LABELS[wallet]) ||
    PAYMENT_METHOD_LABELS[method.type] ||
    method.type
  );
};

const getPaidCurrency = (value: string): Currency | null =>
  isCurrency(value) ? value : null;

const getOrderId = (metadata: Stripe.Metadata): number | null => {
  const id = Number(metadata[PAYMENT_META.orderId]);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getPaymentStatus = (intent: Stripe.PaymentIntent): PaymentStatus => {
  switch (intent.status) {
    case "succeeded":
      return PaymentStatus.Succeeded;
    case "processing":
      return PaymentStatus.Processing;
    case "canceled":
      return PaymentStatus.Unusable;
    default:
      // requires_payment_method / requires_confirmation / requires_action /
      // requires_capture — klient jeszcze nie skończył płacić.
      return PaymentStatus.AwaitingPayment;
  }
};

export const preparePayment = (intent: Stripe.PaymentIntent): PaymentRecord => ({
  id: intent.id,
  status: getPaymentStatus(intent),
  currency: getPaidCurrency(intent.currency),
  paidTotal: (intent.amount_received || intent.amount) / 100,
  orderId: getOrderId(intent.metadata),
  orderKey: intent.metadata[PAYMENT_META.orderKey] || null,
});

// Czy do tej płatności można wrócić przy kolejnej próbie: wciąż czeka na
// klienta (np. po odrzuconej karcie) i opiewa dokładnie na tę kwotę w tej
// walucie.
export const isReusableFor = (
  intent: Stripe.PaymentIntent,
  amount: number,
  currency: Currency
): boolean =>
  (intent.status === "requires_payment_method" ||
    intent.status === "requires_confirmation" ||
    intent.status === "requires_action") &&
  intent.amount === amount &&
  intent.currency === currency;
