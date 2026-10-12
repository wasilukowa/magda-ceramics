import { Address, BillingAddress, CartItem, OrderItem } from "@/contracts/server/cart";
import {
  CheckoutError,
  CheckoutErrorResponse,
  PlacedCheckout,
  StoredPlacedOrder,
  UnavailableReason,
} from "@/contracts/server/checkout";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { isPlacedCheckout } from "@/utility";

// Koszyk sprowadzony do tego, co wolno wysłać na serwer: numer produktu
// i liczba sztuk. Cena zostaje w przeglądarce, bo tam jest tylko podglądem.
export const getOrderItems = (items: CartItem[]): OrderItem[] =>
  items.map((item) => ({ id: item.id, quantity: item.quantity }));

// Adres w kształcie zamówienia WooCommerce. Do paczkomatu pola adresu są
// puste — wtedy adresem jest punkt, żeby Stripe i WooCommerce miały dokąd.
export const getBillingAddress = (
  address: Address,
  locker: InPostPoint | null
): BillingAddress => ({
  first_name: address.firstName,
  last_name: address.lastName,
  email: address.email,
  phone: address.phone,
  address_1: locker ? locker.description || locker.code : address.street,
  address_2: locker ? "" : address.street2,
  city: locker ? locker.city : address.city,
  postcode: locker ? locker.postCode : address.postcode,
  country: address.country,
});

// Odcisk danych z kroków „Dane kontaktowe" i „Wysyłka". Po złożeniu
// zamówienia jego zmiana znaczy, że trzeba „Zapisz zmiany", zanim klient
// zapłaci.
export const getDeliverySnapshot = (
  address: Address,
  method: DeliveryMethod,
  locker: InPostPoint | null
): string => JSON.stringify([address, method, locker?.code ?? null]);

// „Złóż zamówienie" (POST) albo „Zapisz zmiany" (PATCH) — patrz
// /api/checkout/order. Zerwane połączenie wraca jako zwykła odmowa.
export const sendCheckoutOrder = async (
  method: "POST" | "PATCH",
  body: object
): Promise<PlacedCheckout | CheckoutErrorResponse> => {
  try {
    const res = await fetch("/api/checkout/order", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await res.json();
    return isPlacedCheckout(data) ? data : (data as CheckoutErrorResponse);
  } catch {
    return { error: CheckoutError.OrderFailed };
  }
};

// Kod odmowy z API → klucz tłumaczenia w przestrzeni „checkout".
export const getCheckoutErrorKey = (error: unknown): string => {
  if (error === CheckoutError.CatalogUnavailable) return "shopUnavailable";
  if (error === CheckoutError.OrderNotEditable) return "orderNotEditable";
  return "connectionError";
};

// To samo dla strony potwierdzenia („success"), gdzie w grę wchodzą już tylko
// dwa przypadki: płatności nie da się potwierdzić albo zamówienie nie zapisało
// się w WooCommerce.
export const getOrderErrorKey = (error: unknown): string =>
  error === CheckoutError.PaymentNotVerified
    ? "paymentNotVerified"
    : "orderFailed";

export const getUnavailableReasonKey = (reason: UnavailableReason): string =>
  reason === UnavailableReason.SoldOut
    ? "soldOutReasonSold"
    : "soldOutReasonGone";

// Ostatnio złożone w tej karcie zamówienie. Kasa czyści koszyk w chwili
// złożenia (prace są już w zamówieniu), więc po odświeżeniu strony na kroku
// „Płatność" klient zobaczyłby pusty koszyk — dzięki temu widzi drogę do
// swojego zamówienia. Pamięć karty, nie przeglądarki: zamknięcie karty ją
// czyści. Każdy dostęp w try/catch — w trybie prywatnym pamięć potrafi rzucić.
const PLACED_ORDER_KEY = "checkout:placed";

export const rememberPlacedOrder = (order: StoredPlacedOrder): void => {
  try {
    sessionStorage.setItem(PLACED_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Bez pamięci karty klient i tak ma link do zamówienia w mailu.
  }
};

// Surowy zapis — prymityw, więc nadaje się na migawkę useSyncExternalStore.
export const readPlacedOrderRaw = (): string | null => {
  try {
    return sessionStorage.getItem(PLACED_ORDER_KEY);
  } catch {
    return null;
  }
};

export const parsePlacedOrder = (raw: string | null): StoredPlacedOrder | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    const { id, key, number } = (value ?? {}) as Partial<StoredPlacedOrder>;
    return typeof id === "number" && typeof key === "string" && typeof number === "string"
      ? { id, key, number }
      : null;
  } catch {
    return null;
  }
};

export const forgetPlacedOrder = (): void => {
  try {
    sessionStorage.removeItem(PLACED_ORDER_KEY);
  } catch {
    // Nic do zrobienia.
  }
};
