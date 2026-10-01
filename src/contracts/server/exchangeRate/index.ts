// Domena: kursy NBP do ewidencji sprzedaży. To NIE są kursy cen w sklepie —
// te liczy stały kurs w helpers/currency. Raw* = surowa odpowiedź API NBP.

export type RawNbpRate = {
  no: string;
  effectiveDate: string;
  mid: number;
};

export type RawNbpRates = {
  table: string;
  code: string;
  rates: RawNbpRate[];
};

// Średni kurs z jednej tabeli A NBP.
export type NbpRate = {
  // Złotych za 1 €, cztery miejsca po przecinku — tak, jak publikuje NBP.
  mid: number;
  // Dzień tabeli, YYYY-MM-DD.
  effectiveDate: string;
  // Numer tabeli, np. „190/A/NBP/2026" — po nim księgowa znajdzie kurs.
  table: string;
};

// Płatność w euro rozpisana do ewidencji sprzedaży. `conversion` jest puste,
// gdy NBP nie odpowiedział — wtedy Magda przelicza ręcznie.
export type LedgerAmount = {
  // Dzień zapłaty w polskim kalendarzu, YYYY-MM-DD.
  paidOn: string;
  amountEur: number;
  conversion: { rate: NbpRate; amountPln: number } | null;
};
