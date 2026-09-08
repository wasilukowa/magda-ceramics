import { BillingAddress, OrderItem } from "@/contracts/server/cart";
import { PlacedOrder } from "@/contracts/server/order";
import { PaymentRecord } from "@/contracts/server/payment";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";

// Ordered steps of the multi-step checkout, mirrored by CheckoutStepper.
export enum CheckoutStep {
  Address,
  Payment,
  Overview,
}

// Dlaczego pozycji z koszyka nie da się kupić. „Sprzedane" to zwykły przypadek
// przy ceramice — każda praca jest jedna, więc ktoś mógł być szybszy. „Zniknął"
// to produkt usunięty z WooCommerce albo pozbawiony ceny.
export enum UnavailableReason {
  SoldOut = "sold-out",
  Gone = "gone",
}

export type UnavailableItem = {
  id: number;
  name: string;
  reason: UnavailableReason;
};

// Wycena jednej pozycji — zawsze w najmniejszej jednostce waluty (grosze /
// eurocenty), bo taką jednostką liczy Stripe i tylko na liczbach całkowitych
// suma nie potrafi się rozjechać o grosz.
export type PricedLine = {
  id: number;
  quantity: number;
  unitAmount: number;
  amount: number;
};

// Koszyk wyceniony na serwerze, z cen wziętych z WooCommerce. To jedyna wycena,
// której wolno ufać — ta z przeglądarki jest tylko podglądem dla klienta.
export type PricedCart = {
  currency: Currency;
  lines: PricedLine[];
  productsAmount: number;
  shippingAmount: number;
  total: number;
  // Kanoniczny zapis zawartości koszyka („12:1,45:2") zapisywany przy płatności
  // w Stripe. Przy składaniu zamówienia porównujemy go z tym, co przysyła
  // przeglądarka — dzięki temu wiadomo, że klient zapłacił dokładnie za te
  // prace, a nie za inne.
  fingerprint: string;
};

// Powody, dla których kasa odmawia. Kody, nie zdania — tłumaczenie należy do
// widoku, nie do trasy API.
export enum CheckoutError {
  EmptyCart = "empty-cart",
  InvalidCart = "invalid-cart",
  Unavailable = "unavailable",
  CatalogUnavailable = "catalog-unavailable",
  PaymentNotVerified = "payment-not-verified",
  OrderFailed = "order-failed",
}

export type CheckoutFailure = {
  ok: false;
  error: CheckoutError;
  unavailable: UnavailableItem[];
};

export type CartPricingResult = { ok: true; cart: PricedCart } | CheckoutFailure;

export type AvailabilityResult = { ok: true } | CheckoutFailure;

// Kształt odpowiedzi tras kasy przy odmowie — to samo czyta i checkout,
// i strona potwierdzenia.
export type CheckoutErrorResponse = {
  error: CheckoutError;
  unavailable?: UnavailableItem[];
};

// Wszystko, czego potrzeba, żeby zapisać zamówienie w WooCommerce. Waluty ani
// zapłaconej kwoty nie ma tu osobno — jedno i drugie siedzi w `payment`, czyli
// w tym, co o płatności powiedział Stripe.
export type PlaceOrderInput = {
  billing: BillingAddress;
  items: OrderItem[];
  note: string;
  payment: PaymentRecord;
  deliveryMethod?: DeliveryMethod;
  locker?: InPostPoint | null;
};

export type PlaceOrderResult = { ok: true; order: PlacedOrder } | CheckoutFailure;
