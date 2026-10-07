"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { Theme } from "@/contracts/shared";
import { ThemeStore } from "@/contracts/store";
import { createLocalStorageStore } from "@/lib/store/localStorageStore";
import { parseTheme, THEME_STORAGE_KEY } from "@/lib/helpers/theme";

const ThemeContext = createContext<ThemeStore | null>(null);

// Wygląd wybrany przełącznikiem; null = klient niczego nie wybierał.
const chosenStore = createLocalStorageStore<Theme | null>(
  THEME_STORAGE_KEY,
  null,
  parseTheme,
  (value) => value ?? ""
);

// Ustawienie urządzenia klienta — obowiązuje, dopóki niczego nie wybrał.
// Subskrypcja łapie też zmianę w trakcie wizyty (telefon sam przechodzi
// wieczorem w tryb ciemny).
const DARK_QUERY = "(prefers-color-scheme: dark)";
const subscribeSystem = (listener: () => void) => {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const getSystemDark = () => window.matchMedia(DARK_QUERY).matches;
// Serwer nie zna urządzenia klienta. Samą stronę i tak maluje CSS (skrypt
// w <head> i media query) — ten stan służy tylko przełącznikowi.
const getServerSystemDark = () => false;

const applyTheme = (theme: Theme | null) => {
  if (theme) document.documentElement.setAttribute("data-theme", theme);
  else document.documentElement.removeAttribute("data-theme");
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const chosen = useSyncExternalStore(
    chosenStore.subscribe,
    chosenStore.getSnapshot,
    chosenStore.getServerSnapshot
  );
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    getSystemDark,
    getServerSystemDark
  );
  const theme = chosen ?? (systemDark ? Theme.Dark : Theme.Light);

  // Wybór zmieniony w innej karcie dociera tu przez pamięć przeglądarki —
  // atrybut na <html> trzeba wtedy przestawić także w tej karcie.
  // ‼️ Wartość czytana prosto z pamięci, nie z `chosen`: przy hydratacji
  // `chosen` to jeszcze wartość z serwera (null), więc efekt zdejmował atrybut
  // ustawiony przez skrypt w <head>. Klient z ciemnym urządzeniem, który
  // wybrał jasny wygląd, dostawał wtedy na chwilę ciemną stronę — a formularz
  // Stripe'a montujący się w tej chwili zostawał ciemny na jasnej stronie
  // (znalezione 2026-10-07).
  useEffect(() => {
    applyTheme(chosenStore.getSnapshot());
  }, [chosen]);

  // Atrybut zmienia się PRZED zapisem, nie w efekcie: po zapisie komponenty
  // renderują się od nowa, a formularz Stripe'a czyta wtedy kolory z CSS —
  // muszą już być nowe.
  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    chosenStore.write(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeStore {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
