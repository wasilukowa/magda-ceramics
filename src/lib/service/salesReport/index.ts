import "server-only";

import { SalesOrder } from "@/contracts/server/order";
import { SalesReport } from "@/contracts/server/salesReport";
import { getLedgerAmountPln } from "@/lib/helpers/ledger";
import { exchangeRateService } from "@/lib/service/exchangeRate";
import { orderService } from "@/lib/service/order";
import {
  buildSalesReport,
  getSalesLookupStart,
  hasEntriesInMonth,
} from "./helpers";

// Miesięczne zestawienie sprzedaży — z zamówień w WooCommerce i kursów NBP.
class SalesReportService {
  private static instance: SalesReportService;

  static getInstance(): SalesReportService {
    if (!SalesReportService.instance) {
      SalesReportService.instance = new SalesReportService();
    }
    return SalesReportService.instance;
  }

  async getReport(month: string): Promise<SalesReport> {
    const orders = await orderService.getSalesOrders(getSalesLookupStart(month));
    const relevant = orders.filter((order) => hasEntriesInMonth(order, month));
    return buildSalesReport(month, await this.withConversions(relevant));
  }

  // Zamówienie w obcej walucie bez zapisanego przeliczenia (NBP nie
  // odpowiedział przy zapłacie) dostaje je teraz — po tym samym kursie, który
  // obowiązywałby wtedy. Po kolei, bo takich zamówień są pojedyncze sztuki.
  private async withConversions(orders: SalesOrder[]): Promise<SalesOrder[]> {
    const completed: SalesOrder[] = [];
    for (const order of orders) {
      const { foreign } = order;
      if (!foreign || foreign.conversion) {
        completed.push(order);
        continue;
      }
      const rate = await exchangeRateService.getRateBefore(
        foreign.currency,
        foreign.paidOn
      );
      completed.push({
        ...order,
        foreign: {
          ...foreign,
          conversion: rate
            ? { rate, amountPln: getLedgerAmountPln(foreign.amount, rate.mid) }
            : null,
        },
      });
    }
    return completed;
  }
}

export const salesReportService = SalesReportService.getInstance();
