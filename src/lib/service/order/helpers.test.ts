import { describe, expect, it } from "vitest";
import { RawOrder, ReservationStep, UnpaidOrder } from "@/contracts/server/order";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { getShippingCost } from "@/lib/helpers/shipping";
import {
  getDueReminders,
  getReservationDeadline,
  getReservationStep,
  LOCKER_META_KEY,
  ORDER_META,
  prepareOrder,
} from "./helpers";

const PLACED_AT = new Date("2026-10-12T13:05:00Z");

const hoursAfterPlacing = (hours: number) =>
  new Date(PLACED_AT.getTime() + hours * 3_600_000);

const unpaid = (overrides: Partial<UnpaidOrder> = {}): UnpaidOrder => ({
  id: 317,
  number: "317",
  key: "wc_order_test",
  total: 100,
  currency: Currency.PLN,
  email: "delivered@resend.dev",
  firstName: "Test",
  locale: "pl",
  items: [],
  reservedUntil: getReservationDeadline(PLACED_AT),
  remindersSent: 0,
  awaitingConfirmation: false,
  ...overrides,
});

describe("reservation", () => {
  it("holds the work for 48 hours", () => {
    expect(getReservationDeadline(PLACED_AT)).toBe("2026-10-14T13:05:00.000Z");
  });

  it("reminds after 12 and 24 hours", () => {
    expect(getDueReminders(unpaid(), hoursAfterPlacing(11))).toBe(0);
    expect(getDueReminders(unpaid(), hoursAfterPlacing(12))).toBe(1);
    expect(getDueReminders(unpaid(), hoursAfterPlacing(30))).toBe(2);
  });

  it("sends each reminder once", () => {
    const at13h = hoursAfterPlacing(13);
    expect(getReservationStep(unpaid(), at13h)).toBe(ReservationStep.Remind);
    expect(getReservationStep(unpaid({ remindersSent: 1 }), at13h)).toBe(ReservationStep.Wait);
    expect(getReservationStep(unpaid({ remindersSent: 1 }), hoursAfterPlacing(25))).toBe(
      ReservationStep.Remind
    );
  });

  it("does not remind while the bank is confirming the payment", () => {
    expect(
      getReservationStep(unpaid({ awaitingConfirmation: true }), hoursAfterPlacing(13))
    ).toBe(ReservationStep.Wait);
  });

  it("cancels once the 48 hours are up", () => {
    expect(getReservationStep(unpaid(), hoursAfterPlacing(47.9))).not.toBe(ReservationStep.Expire);
    expect(getReservationStep(unpaid(), hoursAfterPlacing(48))).toBe(ReservationStep.Expire);
    expect(
      getReservationStep(unpaid({ awaitingConfirmation: true }), hoursAfterPlacing(49))
    ).toBe(ReservationStep.Expire);
  });
});

const rawOrder = (overrides: Partial<RawOrder> = {}): RawOrder => ({
  id: 731,
  number: "731",
  status: "processing",
  date_created: "2026-10-19T12:00:00",
  total: "80.00",
  currency: "PLN",
  line_items: [{ id: 1, product_id: 580, name: "Świecznik „Łąka”", quantity: 1, total: "60.00" }],
  shipping_total: "20.00",
  ...overrides,
});

describe("order in the account", () => {
  it("shows the shipping cost of a locker delivery", () => {
    const order = prepareOrder(
      rawOrder({ meta_data: [{ key: LOCKER_META_KEY, value: "WAW01M" }] })
    );
    expect(order.shipping).toBe(20);
    expect(order.deliveryMethod).toBe(DeliveryMethod.Locker);
    expect(order.items[0].total + order.shipping).toBe(order.total);
  });

  it("shows the courier rate in euro for an order paid in euro", () => {
    const order = prepareOrder(
      rawOrder({
        shipping: { country: "DE" },
        meta_data: [
          { key: ORDER_META.paidCurrency, value: "EUR" },
          { key: ORDER_META.paidAmount, value: "32.00" },
        ],
      })
    );
    expect(order.currency).toBe(Currency.EUR);
    expect(order.deliveryMethod).toBe(DeliveryMethod.Courier);
    expect(order.shipping).toBe(getShippingCost("DE", Currency.EUR, DeliveryMethod.Courier));
  });
});
