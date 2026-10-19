import { describe, expect, it } from "vitest";
import { LedgerAmount } from "@/contracts/server/exchangeRate";
import { SalesOrder } from "@/contracts/server/order";
import { SalesEntryKind } from "@/contracts/server/salesReport";
import {
  buildSalesReport,
  getPreviousMonth,
  getSalesLookupStart,
  hasEntriesInMonth,
} from "./helpers";

const order = (overrides: Partial<SalesOrder> = {}): SalesOrder => ({
  id: 400,
  number: "400",
  paidAt: "2026-10-05T10:00:00Z",
  totalPln: 185,
  eur: null,
  refunds: [],
  cancelled: false,
  ...overrides,
});

// 43 € po kursie 4,2650 z tabeli NBP.
const paidInEuro = (converted: boolean): LedgerAmount => ({
  paidOn: "2026-10-05",
  amountEur: 43,
  conversion: converted
    ? {
        rate: { mid: 4.265, effectiveDate: "2026-10-03", table: "193/A/NBP/2026" },
        amountPln: 183.4,
      }
    : null,
});

describe("months", () => {
  it("reports the month before the 1st", () => {
    expect(getPreviousMonth("2026-10-01")).toBe("2026-09");
    expect(getPreviousMonth("2026-01-01")).toBe("2025-12");
  });

  it("looks for orders from a day before the month starts", () => {
    expect(getSalesLookupStart("2026-10")).toBe("2026-09-30T00:00:00");
  });
});

describe("buildSalesReport", () => {
  it("counts a sale on the Polish calendar day of payment", () => {
    // 30 września 22:30 UTC to już 1 października w Polsce.
    const lateNight = order({ paidAt: "2026-09-30T22:30:00Z" });
    expect(buildSalesReport("2026-09", [lateNight]).entries).toEqual([]);
    expect(buildSalesReport("2026-10", [lateNight]).entries[0]).toMatchObject({
      day: "2026-10-01",
      amountPln: 185,
    });
  });

  it("takes the NBP amount for an order paid in euro", () => {
    const report = buildSalesReport("2026-10", [order({ eur: paidInEuro(true) })]);
    expect(report.entries[0].amountPln).toBe(183.4);
    expect(report.totalPln).toBe(183.4);
  });

  it("leaves the amount empty when NBP did not answer", () => {
    const report = buildSalesReport("2026-10", [
      order({ number: "401", eur: paidInEuro(false) }),
      order({ number: "402" }),
    ]);
    expect(report.entries.map((entry) => entry.amountPln)).toEqual([null, 185]);
    expect(report.totalPln).toBe(185);
  });

  it("subtracts a refund on the day it was made", () => {
    const report = buildSalesReport("2026-10", [
      order({ refunds: [{ createdAt: "2026-10-07T09:00:00Z", amountPln: 20 }] }),
    ]);
    expect(report.entries).toMatchObject([
      { kind: SalesEntryKind.Sale, amountPln: 185, runningTotalPln: 185 },
      { kind: SalesEntryKind.Refund, day: "2026-10-07", amountPln: -20, runningTotalPln: 165 },
    ]);
    expect(report.totalPln).toBe(165);
  });

  it("refunds an euro order in proportion to its NBP amount", () => {
    const fullRefund = order({
      eur: paidInEuro(true),
      refunds: [{ createdAt: "2026-10-07T09:00:00Z", amountPln: 185 }],
    });
    const report = buildSalesReport("2026-10", [fullRefund]);
    expect(report.entries[1].amountPln).toBe(-183.4);
    expect(report.totalPln).toBe(0);
  });

  it("lists a refund for an order paid in an earlier month", () => {
    const september = order({
      paidAt: "2026-09-20T10:00:00Z",
      refunds: [{ createdAt: "2026-10-02T10:00:00Z", amountPln: 185 }],
    });
    expect(hasEntriesInMonth(september, "2026-10")).toBe(true);
    expect(buildSalesReport("2026-10", [september]).entries).toMatchObject([
      { kind: SalesEntryKind.Refund, amountPln: -185 },
    ]);
  });

  it("asks Magda to check a cancelled sale with no refund recorded", () => {
    const report = buildSalesReport("2026-10", [order({ cancelled: true })]);
    expect(report.entries[0].needsRefundCheck).toBe(true);
  });

  it("sorts by day, then order number", () => {
    const report = buildSalesReport("2026-10", [
      order({ number: "12", paidAt: "2026-10-09T10:00:00Z", totalPln: 70 }),
      order({ number: "11", paidAt: "2026-10-09T08:00:00Z", totalPln: 100 }),
      order({ number: "10", paidAt: "2026-10-02T10:00:00Z", totalPln: 50 }),
    ]);
    expect(report.entries.map((entry) => entry.orderNumber)).toEqual(["10", "11", "12"]);
    expect(report.entries.map((entry) => entry.runningTotalPln)).toEqual([50, 150, 220]);
  });

  it("does not lose a grosz when summing", () => {
    const report = buildSalesReport(
      "2026-10",
      [0.1, 0.2, 0.3].map((totalPln, index) => order({ number: String(index), totalPln }))
    );
    expect(report.totalPln).toBe(0.6);
  });
});
