"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { Currency } from "@/contracts/shared";
import { CurrencyStore } from "@/contracts/store";
import { createLocalStorageStore } from "@/lib/store/localStorageStore";

const CurrencyContext = createContext<CurrencyStore | null>(null);
const STORAGE_KEY = "currency";

// W pamięci przeglądarki jest tylko waluta, którą klient sam wybrał
// przełącznikiem. Dopóki nie wybrał (null), obowiązuje domyślna dla języka
// strony — patrz getDefaultCurrency. Dzięki temu ręczny wybór działa w obu
// językach, a ktoś, kto niczego nie klikał, po przejściu na drugi język dostaje
// jego walutę. Wartość zapisana jest gołym tekstem ("pln"/"eur"), a nie
// JSON-em — stąd własny odczyt zamiast JSON.parse.
const currencyStore = createLocalStorageStore<Currency | null>(
  STORAGE_KEY,
  null,
  (raw) =>
    raw === Currency.EUR || raw === Currency.PLN ? (raw as Currency) : null,
  (value) => value ?? ""
);

export function CurrencyProvider({
  defaultCurrency,
  children,
}: {
  defaultCurrency: Currency;
  children: React.ReactNode;
}) {
  const chosen = useSyncExternalStore(
    currencyStore.subscribe,
    currencyStore.getSnapshot,
    currencyStore.getServerSnapshot
  );
  const currency = chosen ?? defaultCurrency;

  const setCurrency = useCallback((next: Currency) => {
    currencyStore.write(next);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyStore {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
