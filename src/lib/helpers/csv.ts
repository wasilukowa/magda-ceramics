// CSV pod polskiego Excela: średnik zamiast przecinka (przecinek jest
// separatorem dziesiętnym), znacznik BOM na początku (bez niego Excel czyta
// „ł" i „ż" jako krzaczki) i końce wierszy CRLF.
const CSV_SEPARATOR = ";";
const BOM = "﻿";

const escapeCell = (value: string): string =>
  /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const toCsv = (rows: string[][]): string =>
  BOM + rows.map((row) => row.map(escapeCell).join(CSV_SEPARATOR)).join("\r\n") + "\r\n";

// Kwota do komórki: z przecinkiem i bez odstępów między tysiącami — odstęp
// zrobiłby z liczby tekst i Excel nie zsumowałby kolumny.
export const formatCsvAmount = (value: number): string =>
  value.toFixed(2).replace(".", ",");
