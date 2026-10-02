import { Currency } from "@/contracts/shared";
import { CartItem } from "@/contracts/server/cart";

// Single source of truth for PLN→EUR conversion. Changing the rate is a
// one-line edit. A live bank rate was intentionally rejected — fixed rate
// keeps prices stable and predictable.
export const EXCHANGE_RATE_PLN_PER_EUR = 4.3;

// The currency a visitor sees until they pick one with the switcher. Anyone
// whose browser isn't set to Polish lands on the English site, so English
// means "from abroad" and gets euro (decision 2026-10-02, N23 in the audit).
// A currency picked by hand always wins, in both languages.
export const getDefaultCurrency = (locale: string): Currency =>
  locale === "pl" ? Currency.PLN : Currency.EUR;

// Auto-convert a PLN amount to EUR, rounded UP to a whole euro — always in
// the studio's favour. Every EUR product price comes from here: hand-set EUR
// prices (the `price_eur` field in WooCommerce) were dropped on 2026-10-01, so
// one rule covers the whole catalogue and a PLN price change moves the EUR
// price with it.
export const convertPlnToEur = (pln: number): number =>
  Math.ceil(pln / EXCHANGE_RATE_PLN_PER_EUR);

// Unit price of a priced item in the chosen currency.
export const getUnitPrice = (item: { price: string }, currency: Currency): number => {
  const pln = parseFloat(item.price);
  return currency === Currency.EUR ? convertPlnToEur(pln) : pln;
};

export const getCartTotal = (items: CartItem[], currency: Currency): number =>
  items.reduce((sum, item) => sum + getUnitPrice(item, currency) * item.quantity, 0);

// "90 zł", "182,50 zł", "21 €" — whole amounts drop the decimals.
export const formatPrice = (amount: number, currency: Currency): string => {
  const value = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return currency === Currency.EUR ? `${value} €` : `${value} zł`;
};
