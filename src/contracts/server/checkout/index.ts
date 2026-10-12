import { BillingAddress, CartItem, OrderItem } from "@/contracts/server/cart";
import { PlacedOrder } from "@/contracts/server/order";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";

// Kroki kasy, w kolejności z CheckoutStepper (decyzja Natalii 2026-10-12).
// Zamówienie powstaje na końcu kroku „Wysyłka" („Złóż zamówienie"), płatność
// jest osobnym krokiem po nim, a „Podsumowanie" to strona po zapłacie.
export enum CheckoutStep {
  Contact,
  Shipping,
  Payment,
  Summary,
}

// Dlaczego pozycji z koszyka nie da się kupić. „Sprzedane" to zwykły przypadek
// przy ceramice — każda praca jest jedna, więc ktoś mógł być szybszy. „Zniknął"
// to produkt usunięty z WooCommerce albo pozbawiony ceny.
export enum UnavailableReason {
  SoldOut = "sold-out",
  Gone = "gone",
  // Ktoś złożył na nią zamówienie i ma 48 h na zapłatę. Klient widzi wtedy
  // „niedostępne", nie „sprzedane" — praca może jeszcze wrócić do sklepu.
  Reserved = "reserved",
}

export type UnavailableItem = {
  id: number;
  name: string;
  reason: UnavailableReason;
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
  TooManyAttempts = "too-many-attempts",
  // Złożonego zamówienia nie da się już poprawić: opłacone, płatność w toku,
  // anulowane albo klucz się nie zgadza.
  OrderNotEditable = "order-not-editable",
}

export type CheckoutFailure = {
  ok: false;
  error: CheckoutError;
  unavailable: UnavailableItem[];
};

export type AvailabilityResult = { ok: true } | CheckoutFailure;

// Kształt odpowiedzi tras kasy przy odmowie — to samo czyta i checkout,
// i strona potwierdzenia.
export type CheckoutErrorResponse = {
  error: CheckoutError;
  unavailable?: UnavailableItem[];
};

// Dane dostawy z kroku „Wysyłka" — przy składaniu i przy poprawce złożonego
// zamówienia („Wstecz" z kroku „Płatność", decyzja Natalii 2026-10-12).
export type DeliveryDetails = {
  billing: BillingAddress;
  note: string;
  // Już rozstrzygnięty (resolveDeliveryMethod): paczkomat zawsze z punktem.
  deliveryMethod: DeliveryMethod;
  locker?: InPostPoint | null;
};

// Zamówienie WooCommerce od strony dostawy — patrz getDeliveryFields.
export type DeliveryFields = {
  billing: BillingAddress;
  shipping: BillingAddress & { company?: string };
  shippingLine: { method_id: string; method_title: string; total: string };
  customerNote: string;
  // Kod paczkomatu albo null przy kurierze.
  lockerCode: string | null;
};

// Wszystko, czego potrzeba, żeby złożyć zamówienie w WooCommerce, zanim
// klient zapłaci. O tym, czy zapłacono, rozstrzyga dopiero domknięcie
// płatności — patrz CheckoutService.completePayment.
export type PlaceOrderInput = DeliveryDetails & {
  items: OrderItem[];
  // Zalogowany klient — z sesji, nigdy z żądania. Dzięki temu zamówienie
  // pojawia się potem w jego „Moich zamówieniach".
  customerId: number | null;
  // Język i waluta z kasy — patrz OrderPreferences.
  locale?: string;
  currency: Currency;
  // Numer tej wizyty w kasie, nadany przez przeglądarkę. To samo „Złóż
  // zamówienie" drugi raz (ponowione żądanie po zerwanym połączeniu) oddaje
  // zamówienie już złożone, zamiast zakładać drugie.
  checkoutId: string;
};

export type PlaceOrderResult = { ok: true; order: PlacedOrder } | CheckoutFailure;

// Poprawka złożonego, jeszcze nieopłaconego zamówienia. Numer i klucz
// zamówienia przyszły z jego złożenia — klucz jest dowodem, że poprawia ten,
// kto składał.
export type UpdateOrderInput = DeliveryDetails & {
  orderId: number;
  key: string;
};

// Zamówienie złożone w kasie i gotowe do zapłaty — odpowiedź na „Złóż
// zamówienie" i „Zapisz zmiany".
export type PlacedCheckout = {
  orderId: number;
  key: string;
  number: string;
  // Do kiedy praca czeka na wpłatę (ISO).
  reservedUntil: string | null;
  // Płatność w Stripe dla formularza w kroku „Płatność". Null, gdy nie dała
  // się uruchomić — zamówienie i tak jest złożone, a zapłacić można później
  // ze strony zamówienia.
  clientSecret: string | null;
};

// Ostatnio złożone zamówienie zapamiętane w karcie przeglądarki — patrz
// rememberPlacedOrder.
export type StoredPlacedOrder = {
  id: number;
  key: string;
  number: string;
};

// Kasa po „Złóż zamówienie" (strona kasy trzyma to w stanie).
export type CheckoutPlacement = {
  checkout: PlacedCheckout;
  // Koszyk i waluta z chwili złożenia. Koszyk jest już pusty (prace są
  // w zamówieniu), a zmiana waluty w nagłówku nie zmienia złożonego zamówienia.
  items: CartItem[];
  currency: Currency;
  // Odcisk danych z ostatniego zapisu — patrz getDeliverySnapshot.
  details: string;
};
