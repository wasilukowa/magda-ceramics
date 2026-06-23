import { Currency } from "@/contracts/shared";

export type { Currency };

export type CurrencyStore = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
};
