"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Currency } from "@/contracts/shared";
import { CurrencyStore } from "@/lib/store/slices/currencySlice";

const CurrencyContext = createContext<CurrencyStore | null>(null);
const STORAGE_KEY = "currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Default to PLN; the customer opts into EUR via the navbar switcher.
  const [currency, setCurrencyState] = useState<Currency>(Currency.PLN);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === Currency.EUR || stored === Currency.PLN) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrencyState((prev) => {
      const next = prev === Currency.PLN ? Currency.EUR : Currency.PLN;
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyStore {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
