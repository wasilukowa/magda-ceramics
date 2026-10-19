import { describe, expect, it } from "vitest";
import { RawNbpRates } from "@/contracts/server/exchangeRate";
import { prepareLastNbpRate } from "./helpers";

const rates = (list: RawNbpRates["rates"]): RawNbpRates => ({ table: "A", code: "EUR", rates: list });

describe("prepareLastNbpRate", () => {
  it("takes the latest table from the range", () => {
    const raw = rates([
      { no: "192/A/NBP/2026", effectiveDate: "2026-10-02", mid: 4.2601 },
      { no: "193/A/NBP/2026", effectiveDate: "2026-10-03", mid: 4.265 },
    ]);
    expect(prepareLastNbpRate(raw)).toEqual({
      mid: 4.265,
      effectiveDate: "2026-10-03",
      table: "193/A/NBP/2026",
    });
  });

  it("returns nothing for an empty or broken answer", () => {
    expect(prepareLastNbpRate(rates([]))).toBeNull();
    expect(prepareLastNbpRate(rates([{ no: "1/A/NBP/2026", effectiveDate: "2026-10-03", mid: 0 }]))).toBeNull();
    expect(prepareLastNbpRate({} as RawNbpRates)).toBeNull();
  });
});
