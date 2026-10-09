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
  value === Currency.PLN || value === Currency.EUR ? value : null;

const getShippingAmount = (metadata: Stripe.Metadata): number | null => {
  const raw = metadata[PAYMENT_META.shipping];
  const amount = Number(raw);
  return raw && Number.isInteger(amount) && amount >= 0 ? amount : null;
};

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
  shippingAmount: getShippingAmount(intent.metadata),
  orderId: getOrderId(intent.metadata),
  orderKey: intent.metadata[PAYMENT_META.orderKey] || null,
});

// Czy do tej płatności wolno przypiąć zamówienie z kasy: musi jeszcze czekać
// na klienta i być wyceniona przez kasę za dokładnie ten koszyk, ten kraj
// i tę wysyłkę. Kraj się liczy, bo to on decyduje o cenie wysyłki — bez tego
// dało się zapłacić za wysyłkę krajową i podać adres zagraniczny. Kwota
// wysyłki z tego samego powodu: paczkomat za granicą jest tańszy od kuriera,
// więc płatność wyceniona „za paczkomat" nie opłaci zamówienia z kurierem.
// Pusty zapis koszyka odpada z automatu: płatność bez naszych metadanych to
// płatność, której kasa nie wyceniała (np. ta z panelu klienta).
export const canDraftOrderFor = (
  payment: PaymentRecord,
  fingerprint: string,
  country: string,
  shippingAmount: number
): boolean =>
  payment.status === PaymentStatus.AwaitingPayment &&
  payment.currency !== null &&
  !!payment.cart &&
  payment.cart === fingerprint &&
  payment.country === country &&
  payment.shippingAmount === shippingAmount;

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
