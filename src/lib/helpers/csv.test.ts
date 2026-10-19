import { describe, expect, it } from "vitest";
import { formatCsvAmount, toCsv } from "./csv";

describe("CSV for Excel", () => {
  it("starts with a BOM and separates cells with semicolons", () => {
    expect(toCsv([["Data", "Kwota"], ["2026-10-01", "185,00"]])).toBe(
      "﻿Data;Kwota\r\n2026-10-01;185,00\r\n"
    );
  });

  it("quotes cells that would break the row", () => {
    expect(toCsv([['Kubek "Łąka"', "a;b", "dwie\nlinie"]])).toBe(
      '﻿"Kubek ""Łąka""";"a;b";"dwie\nlinie"\r\n'
    );
  });

  it("writes amounts with a comma and no thousands separator", () => {
    expect(formatCsvAmount(1234.5)).toBe("1234,50");
    expect(formatCsvAmount(-20)).toBe("-20,00");
  });
});
