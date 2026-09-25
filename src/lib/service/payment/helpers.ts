import Stripe from "stripe";
import { PaymentRecord, PaymentStatus } from "@/contracts/server/payment";
import { Currency } from "@/contracts/shared";

// Klucze metadanych płatności w Stripe. `cart`, `country` i `shipping`
// zapisuje kasa przy wycenie koszyka. `orderId` trafia tam dwiema drogami: od
// szkicu zamówienia, który kasa zapisuje tuż przed płatnością, albo od panelu
// klienta, gdy płatność powstaje DLA zamówienia, które już istniało.
// `orderKey` dokłada tylko ta pierwsza droga — i po nim poznajemy płatność
// z kasy, którą wolno domknąć bez sesji klienta (np. z webhooka).
export const PAYMENT_META = {
  cart: "cart",
  country: "country",
  shipping: "shipping",
  orderId: "orderId",
  orderKey: "orderKey",
} as const;

const getPaidCurrency = (value: string): Currency | null =>
  value === Currency.PLN || value === Currency.EUR ? value : null;

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
  cart: intent.metadata[PAYMENT_META.cart] ?? "",
  country: intent.metadata[PAYMENT_META.country] ?? "",
  orderId: getOrderId(intent.metadata),
  orderKey: intent.metadata[PAYMENT_META.orderKey] || null,
});

// Czy do tej płatności wolno przypiąć zamówienie z kasy: musi jeszcze czekać
// na klienta i być wyceniona przez kasę za dokładnie ten koszyk i ten kraj.
// Kraj się liczy, bo to on decyduje o cenie wysyłki — bez tego dało się
// zapłacić za wysyłkę krajową i podać adres zagraniczny. Pusty zapis koszyka
// odpada z automatu: płatność bez naszych metadanych to płatność, której kasa
// nie wyceniała (np. ta z panelu klienta).
export const canDraftOrderFor = (
  payment: PaymentRecord,
  fingerprint: string,
  country: string
): boolean =>
  payment.status === PaymentStatus.AwaitingPayment &&
  payment.currency !== null &&
  !!payment.cart &&
  payment.cart === fingerprint &&
  payment.country === country;

// Czy ta płatność jest za to konkretne zamówienie. Numer zamówienia zapisuje
// w metadanych sam serwis przy tworzeniu płatności, więc nie da się nim
// domknąć cudzego zamówienia.
export const isPaymentForOrder = (
  payment: PaymentRecord,
  orderId: number
): boolean =>
  payment.status === PaymentStatus.Succeeded && payment.orderId === orderId;
