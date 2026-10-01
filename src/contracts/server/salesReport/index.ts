// Domena: miesięczne zestawienie sprzedaży dla Magdy — podstawa do
// uproszczonej ewidencji sprzedaży (działalność nierejestrowana).

import { LedgerAmount } from "@/contracts/server/exchangeRate";

export enum SalesEntryKind {
  Sale = "sale",
  Refund = "refund",
}

// Jeden wiersz zestawienia: sprzedaż w dniu zapłaty albo zwrot w dniu zwrotu.
export type SalesEntry = {
  kind: SalesEntryKind;
  // Dzień w polskim kalendarzu, YYYY-MM-DD.
  day: string;
  orderNumber: string;
  // Kwota do ewidencji w złotych, z wysyłką; zwrot ze znakiem minus. Null,
  // gdy zamówienie było w euro, a kursu NBP nie udało się pobrać.
  amountPln: number | null;
  // Suma od początku miesiąca do tego wiersza włącznie.
  runningTotalPln: number;
  // Zamówienie zapłacone w euro.
  eur: LedgerAmount | null;
  // Sprzedaż anulowana bez zapisanego zwrotu — kwota stoi w zestawieniu,
  // ale Magda musi sprawdzić, czy pieniądze nie wróciły do klienta.
  needsRefundCheck: boolean;
};

export type SalesReport = {
  // YYYY-MM
  month: string;
  entries: SalesEntry[];
  totalPln: number;
};
