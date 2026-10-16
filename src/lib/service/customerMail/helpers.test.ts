import { describe, expect, it } from "vitest";
import { CancelReason, OrderStatus, RawOrder } from "@/contracts/server/order";
import { ORDER_META, prepareCustomerOrderMail } from "@/lib/service/order/helpers";
import { isCancelledInPanel } from "./helpers";

const rawOrder = (overrides: Partial<RawOrder> = {}): RawOrder => ({
  id: 401,
  number: "401",
  status: OrderStatus.Cancelled,
  date_created: "2026-10-16T12:00:00",
  total: "150.00",
  currency: "PLN",
  line_items: [],
  billing: { email: "delivered@resend.dev", first_name: "Test", country: "PL" },
  meta_data: [],
  ...overrides,
});

const mailFor = (overrides: Partial<RawOrder> = {}) => {
  const order = prepareCustomerOrderMail(rawOrder(overrides));
  if (!order) throw new Error("order without e-mail");
  return order;
};

describe("cancelled in the WordPress panel", () => {
  it("mails the customer when Magda cancels the order", () => {
    expect(isCancelledInPanel(mailFor())).toBe(true);
  });

  it("leaves orders the shop cancelled itself — they already got their mail", () => {
    for (const reason of [CancelReason.Customer, CancelReason.Expired, CancelReason.Overbooked]) {
      const order = mailFor({ meta_data: [{ key: ORDER_META.cancelReason, value: reason }] });
      expect(order.cancelReason).toBe(reason);
      expect(isCancelledInPanel(order)).toBe(false);
    }
  });

  it("sends the mail once", () => {
    const order = mailFor({
      meta_data: [{ key: ORDER_META.mailCancelled, value: "2026-10-16T12:05:00Z" }],
    });
    expect(isCancelledInPanel(order)).toBe(false);
  });

  it("ignores orders that are no longer cancelled", () => {
    expect(isCancelledInPanel(mailFor({ status: OrderStatus.Processing }))).toBe(false);
  });

  it("knows whether the customer had paid", () => {
    expect(mailFor().paid).toBe(false);
    expect(mailFor({ date_paid_gmt: "2026-10-16T12:01:00" }).paid).toBe(true);
  });
});
