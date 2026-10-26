import { Currency } from "@/contracts/shared";
import { CURRENCY_SYMBOLS } from "@/lib/helpers/currency";

// Kwota w walucie (euro, funty) przeliczona po kursie NBP i zaokrąglona do
// grosza. Liczona na liczbach całkowitych (centy × kurs w dziesięciotysięcznych),
// bo na ułamkach 19 × 4,265 wychodzi 81,03499… i grosz ucieka w dół.
export const getLedgerAmountPln = (amount: number, rate: number): number => {
  const cents = Math.round(amount * 100);
  const rateUnits = Math.round(rate * 10_000);
  return Math.round((cents * rateUnits) / 10_000) / 100;
};

// Liczba po polsku, z przecinkiem — tak, jak Magda przepisze ją do ewidencji.
export const formatPlNumber = (value: number, fractionDigits: number): string =>
  new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

// Kwota z groszami i znakiem waluty, po polsku: „19,00 €", „18,00 £".
export const formatPlAmount = (amount: number, currency: Currency): string =>
  `${formatPlNumber(amount, 2)} ${CURRENCY_SYMBOLS[currency]}`;
