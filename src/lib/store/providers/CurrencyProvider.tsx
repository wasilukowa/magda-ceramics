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

// Domyślnie PLN; na EUR klient przechodzi przełącznikiem w pasku. Wartość
// zapisana jest gołym tekstem ("pln"/"eur"), a nie JSON-em — stąd własny
// odczyt zamiast JSON.parse.
const currencyStore = createLocalStorageStore<Currency>(
  STORAGE_KEY,
  Currency.PLN,
  (raw) =>
    raw === Currency.EUR || raw === Currency.PLN ? (raw as Currency) : Currency.PLN,
  (value) => value
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = useSyncExternalStore(
    currencyStore.subscribe,
    currencyStore.getSnapshot,
    currencyStore.getServerSnapshot
  );

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
