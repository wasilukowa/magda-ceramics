import "server-only";

import { serverFetch } from "@/lib/api";
import { NbpRate, RawNbpRates } from "@/contracts/server/exchangeRate";
import { Currency } from "@/contracts/shared";
import { shiftDay } from "@/lib/helpers/date";
import { prepareLastNbpRate } from "./helpers";

// Tabela A — średnie kursy, po których przelicza się przychód w walucie.
const NBP_RATES_URL = "https://api.nbp.pl/api/exchangerates/rates/a";

// Najdłuższa przerwa bez tabeli NBP (święta sklejone z weekendem) to kilka
// dni — dziesięć dni wstecz zawsze sięga ostatniego dnia roboczego.
const LOOKBACK_DAYS = 10;

// Kurs pobiera się w trakcie domykania zapłaty, na które czeka webhook
// Stripe'a. Wolny NBP nie może go trzymać przez pełne 10 s serverFetch.
const NBP_TIMEOUT_MS = 5_000;

// Kursy walut z publicznego API NBP — wyłącznie do ewidencji sprzedaży.
class ExchangeRateService {
  private static instance: ExchangeRateService;

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  // Średni kurs waluty (euro, funta) z ostatniego dnia roboczego PRZED
  // podanym dniem — po takim przelicza się przychód w walucie (art. 11a
  // ustawy o PIT). Null, gdy NBP nie odpowiedział: kurs jest dodatkiem do
  // zapisu zapłaty i jego brak nie może tego zapisu zatrzymać.
  async getRateBefore(currency: Currency, day: string): Promise<NbpRate | null> {
    const from = shiftDay(day, -LOOKBACK_DAYS);
    const to = shiftDay(day, -1);
    const url = `${NBP_RATES_URL}/${currency}/${from}/${to}/?format=json`;

    try {
      const res = await serverFetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(NBP_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`NBP API error: ${res.status}`);
      return prepareLastNbpRate((await res.json()) as RawNbpRates);
    } catch (error) {
      console.error(`NBP: ${currency.toUpperCase()} rate before ${day} not fetched:`, error);
      return null;
    }
  }
}

export const exchangeRateService = ExchangeRateService.getInstance();
