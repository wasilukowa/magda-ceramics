import { CartItem, OrderItem } from "@/contracts/server/cart";
import {
  CheckoutError,
  CheckoutErrorResponse,
  UnavailableItem,
  UnavailableReason,
} from "@/contracts/server/checkout";

// Koszyk sprowadzony do tego, co wolno wysłać na serwer: numer produktu
// i liczba sztuk. Cena zostaje w przeglądarce, bo tam jest tylko podglądem.
export const getOrderItems = (items: CartItem[]): OrderItem[] =>
  items.map((item) => ({ id: item.id, quantity: item.quantity }));

// Kod odmowy z API → klucz tłumaczenia w przestrzeni „checkout".
export const getCheckoutErrorKey = (error: unknown): string =>
  error === CheckoutError.CatalogUnavailable
    ? "shopUnavailable"
    : "connectionError";

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

// Ostatnie sprawdzenie magazynu tuż przed obciążeniem karty. Zerwane połączenie
// albo milczący WooCommerce świadomie nie blokują płatności — lepiej przyjąć
// zamówienie i wyłapać konflikt przy jego zapisie niż stracić sprzedaż przez
// czkawkę serwera WordPressa.
export const getSoldOutItems = async (
  items: CartItem[]
): Promise<UnavailableItem[]> => {
  try {
    const res = await fetch("/api/checkout/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: getOrderItems(items) }),
    });
    if (res.ok) return [];

    const data = (await res.json()) as CheckoutErrorResponse;
    return data.error === CheckoutError.Unavailable
      ? data.unavailable ?? []
      : [];
  } catch {
    return [];
  }
};
