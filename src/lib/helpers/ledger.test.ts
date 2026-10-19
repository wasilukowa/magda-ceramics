import { describe, expect, it } from "vitest";
import { formatPlNumber, getLedgerAmountPln } from "./ledger";

describe("getLedgerAmountPln", () => {
  it("converts euro at the NBP rate without losing a grosz", () => {
    // Na ułamkach 19 × 4,265 daje 81,03499…
    expect(getLedgerAmountPln(19, 4.265)).toBe(81.04);
    expect(getLedgerAmountPln(43, 4.2650)).toBe(183.4);
    expect(getLedgerAmountPln(11.5, 4.3012)).toBe(49.46);
  });
});

describe("formatPlNumber", () => {
  it("writes numbers the Polish way", () => {
    expect(formatPlNumber(4.265, 4)).toBe("4,2650");
    expect(formatPlNumber(81.04, 2)).toBe("81,04");
  });
});
