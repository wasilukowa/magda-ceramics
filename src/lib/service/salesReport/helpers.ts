import { SalesOrder } from "@/contracts/server/order";
import {
  SalesEntry,
  SalesEntryKind,
  SalesReport,
} from "@/contracts/server/salesReport";
import { getWarsawDay, shiftDay } from "@/lib/helpers/date";

// Kwoty liczymy w groszach — sumowanie ułamków potrafi zgubić grosz.
const toGrosze = (value: number): number => Math.round(value * 100);

const isInMonth = (day: string, month: string): boolean =>
  day.startsWith(`${month}-`);

// Miesiąc poprzedzający podany dzień: „2026-10-01" → „2026-09".
export const getPreviousMonth = (day: string): string =>
  shiftDay(`${day.slice(0, 7)}-01`, -1).slice(0, 7);

// Chwila, od której szukamy zmienionych zamówień (UTC, bez strefy — tak
// przyjmuje to WooCommerce). Dzień zapasu przed początkiem miesiąca
// pokrywa różnicę między czasem polskim a UTC.
export const getSalesLookupStart = (month: string): string =>
  `${shiftDay(`${month}-01`, -1)}T00:00:00`;

// Czy zamówienie ma w tym miesiącu cokolwiek do zestawienia.
export const hasEntriesInMonth = (order: SalesOrder, month: string): boolean =>
  isInMonth(getWarsawDay(new Date(order.paidAt)), month) ||
  order.refunds.some((refund) =>
    isInMonth(getWarsawDay(new Date(refund.createdAt)), month)
  );

// Sprzedaż w złotych: dla zamówienia w euro kwota z przeliczenia NBP, dla
// reszty suma zamówienia.
const getSaleGrosze = (order: SalesOrder): number | null => {
  if (!order.eur) return toGrosze(order.totalPln);
  return order.eur.conversion ? toGrosze(order.eur.conversion.amountPln) : null;
};

// Zwrot w złotych. WooCommerce zapisuje go w złotych z katalogu, a sprzedaż
// w euro trafiła do ewidencji po kursie NBP — zwrot liczymy więc jako tę
// samą część kwoty z ewidencji. Pełny zwrot zdejmuje dokładnie tyle, ile
// sprzedaż dodała.
const getRefundGrosze = (order: SalesOrder, refundPln: number): number | null => {
  if (!order.eur) return -toGrosze(refundPln);
  const saleGrosze = getSaleGrosze(order);
  const totalGrosze = toGrosze(order.totalPln);
  if (saleGrosze === null || totalGrosze === 0) return null;
  return -Math.round((saleGrosze * toGrosze(refundPln)) / totalGrosze);
};

type DraftEntry = Omit<SalesEntry, "amountPln" | "runningTotalPln"> & {
  grosze: number | null;
};

export const buildSalesReport = (
  month: string,
  orders: SalesOrder[]
): SalesReport => {
  const drafts: DraftEntry[] = orders.flatMap((order) => {
    const entries: DraftEntry[] = [];
    const paidOn = getWarsawDay(new Date(order.paidAt));

    if (isInMonth(paidOn, month)) {
      entries.push({
        kind: SalesEntryKind.Sale,
        day: paidOn,
        orderNumber: order.number,
        grosze: getSaleGrosze(order),
        eur: order.eur,
        needsRefundCheck: order.cancelled && order.refunds.length === 0,
      });
    }

    for (const refund of order.refunds) {
      const day = getWarsawDay(new Date(refund.createdAt));
      if (!isInMonth(day, month)) continue;
      entries.push({
        kind: SalesEntryKind.Refund,
        day,
        orderNumber: order.number,
        grosze: getRefundGrosze(order, refund.amountPln),
        eur: order.eur,
        needsRefundCheck: false,
      });
    }

    return entries;
  });

  // Po dniu, potem po numerze zamówienia; w tym samym dniu sprzedaż przed
  // zwrotem.
  drafts.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      Number(a.orderNumber) - Number(b.orderNumber) ||
      (a.kind === SalesEntryKind.Sale ? -1 : 1)
  );

  let running = 0;
  const entries = drafts.map(({ grosze, ...entry }) => {
    running += grosze ?? 0;
    return {
      ...entry,
      amountPln: grosze === null ? null : grosze / 100,
      runningTotalPln: running / 100,
    };
  });

  return { month, entries, totalPln: running / 100 };
};
