import { Currency } from "@/contracts/shared";
import { CartItem } from "@/contracts/server/cart";

// Single source of truth for the shop's exchange rates: złoty per one unit of
// each currency. Changing a rate is a one-line edit. A live bank rate was
// intentionally rejected — fixed rates keep prices stable and predictable.
// Funt: 5,20 (decyzja Natalii 2026-10-26; NBP tego dnia 5,24 — trochę niżej,
// więc ceny w funtach wychodzą odrobinę na korzyść pracowni, jak przy euro).
export const EXCHANGE_RATES_PLN: Record<Currency, number> = {
  [Currency.PLN]: 1,
  [Currency.EUR]: 4.3,
  [Currency.GBP]: 5.2,
};

// Znak waluty — w cenach na stronie i w polskich notatkach dla pracowni.
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.PLN]: "zł",
  [Currency.EUR]: "€",
  [Currency.GBP]: "£",
};

// The currency a visitor sees until they pick one with the switcher. Anyone
// whose browser isn't set to Polish lands on the English site, so English
// means "from abroad" and gets euro (decision 2026-10-02, N23 in the audit).
// Funty tylko z przełącznika (decyzja 2026-10-26). A currency picked by hand
// always wins, in both languages.
export const getDefaultCurrency = (locale: string): Currency =>
  locale === "pl" ? Currency.PLN : Currency.EUR;

// Convert a PLN amount to the chosen currency, rounded UP to a whole unit —
// always in the studio's favour. Every foreign product price comes from here:
// hand-set EUR prices (the `price_eur` field in WooCommerce) were dropped on
// 2026-10-01, so one rule covers the whole catalogue and a PLN price change
// moves the foreign prices with it.
export const convertFromPln = (pln: number, currency: Currency): number =>
  currency === Currency.PLN ? pln : Math.ceil(pln / EXCHANGE_RATES_PLN[currency]);

// Unit price of a priced item in the chosen currency.
export const getUnitPrice = (item: { price: string }, currency: Currency): number =>
  convertFromPln(parseFloat(item.price), currency);

export const getCartTotal = (items: CartItem[], currency: Currency): number =>
  items.reduce((sum, item) => sum + getUnitPrice(item, currency) * item.quantity, 0);

// "90 zł", "182.50 zł", "21 €", "£18" — whole amounts drop the decimals.
// Funt stoi przed kwotą, tak jak piszą go Brytyjczycy.
export const formatPrice = (amount: number, currency: Currency): string => {
  const value = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  const symbol = CURRENCY_SYMBOLS[currency];
  return currency === Currency.GBP ? `${symbol}${value}` : `${value} ${symbol}`;
};
