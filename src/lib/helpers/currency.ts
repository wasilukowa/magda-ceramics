import { Currency } from "@/contracts/shared";
import { CartItem } from "@/contracts/server/cart";

// Single source of truth for PLN→EUR conversion. Changing the rate is a
// one-line edit. A live bank rate was intentionally rejected — fixed rate
// keeps prices stable and predictable.
export const EXCHANGE_RATE_PLN_PER_EUR = 4.3;

// Auto-convert a PLN amount to EUR, rounded UP to a whole euro — always in
// the studio's favour. Used only as a fallback when a product has no hand-set
// EUR price.
export const convertPlnToEur = (pln: number): number =>
  Math.ceil(pln / EXCHANGE_RATE_PLN_PER_EUR);

// Unit price of a priced item in the chosen currency. EUR prefers the
// hand-set price (price_eur in WooCommerce) and falls back to conversion.
export const getUnitPrice = (
  item: { price: string; priceEur: number | null },
  currency: Currency
): number => {
  const pln = parseFloat(item.price);
  if (currency === Currency.EUR) {
    return item.priceEur ?? convertPlnToEur(pln);
  }
  return pln;
};

export const getCartTotal = (items: CartItem[], currency: Currency): number =>
  items.reduce((sum, item) => sum + getUnitPrice(item, currency) * item.quantity, 0);

// "90 zł", "182,50 zł", "21 €" — whole amounts drop the decimals.
export const formatPrice = (amount: number, currency: Currency): string => {
  const value = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return currency === Currency.EUR ? `${value} €` : `${value} zł`;
};
