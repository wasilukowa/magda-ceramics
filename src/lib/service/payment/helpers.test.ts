import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { PaymentStatus } from "@/contracts/server/payment";
import { Currency } from "@/contracts/shared";
import { getPaymentMethodLabel, isReusableFor, preparePayment } from "./helpers";

const intent = (overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent =>
  ({
    id: "pi_test",
    status: "succeeded",
    amount: 18500,
    amount_received: 18500,
    currency: "pln",
    metadata: { orderId: "317", orderKey: "wc_order_test" },
    ...overrides,
  }) as Stripe.PaymentIntent;

const method = (type: string, wallet?: string): Stripe.PaymentMethod =>
  ({ type, card: wallet ? { wallet: { type: wallet } } : undefined }) as Stripe.PaymentMethod;

describe("preparePayment", () => {
  it("reads the paid amount, currency and order from Stripe", () => {
    expect(preparePayment(intent())).toEqual({
      id: "pi_test",
      status: PaymentStatus.Succeeded,
      currency: Currency.PLN,
      paidTotal: 185,
      orderId: 317,
      orderKey: "wc_order_test",
    });
  });

  it("falls back to the amount due before the money arrives", () => {
    const pending = intent({ status: "processing", amount: 4250, amount_received: 0, currency: "eur" });
    expect(preparePayment(pending)).toMatchObject({
      status: PaymentStatus.Processing,
      currency: Currency.EUR,
      paidTotal: 42.5,
    });
  });

  it("tells a finished payment from one still waiting for the customer", () => {
    expect(preparePayment(intent({ status: "canceled" })).status).toBe(PaymentStatus.Unusable);
    expect(preparePayment(intent({ status: "requires_payment_method" })).status).toBe(
      PaymentStatus.AwaitingPayment
    );
    expect(preparePayment(intent({ status: "requires_action" })).status).toBe(
      PaymentStatus.AwaitingPayment
    );
  });

  it("does not trust a currency the shop does not sell in", () => {
    expect(preparePayment(intent({ currency: "usd" })).currency).toBeNull();
  });

  it("ignores an order number that is not a real order", () => {
    for (const orderId of ["abc", "0", "-5", "3.5", ""]) {
      expect(preparePayment(intent({ metadata: { orderId } })).orderId).toBeNull();
    }
    expect(preparePayment(intent({ metadata: {} }))).toMatchObject({
      orderId: null,
      orderKey: null,
    });
  });
});

describe("isReusableFor", () => {
  it("reuses a payment still waiting for the same amount", () => {
    const waiting = intent({ status: "requires_payment_method", amount: 18500 });
    expect(isReusableFor(waiting, 18500, Currency.PLN)).toBe(true);
  });

  it("starts a new payment when the amount or currency changed", () => {
    const waiting = intent({ status: "requires_payment_method", amount: 18500 });
    expect(isReusableFor(waiting, 20500, Currency.PLN)).toBe(false);
    expect(isReusableFor(waiting, 18500, Currency.EUR)).toBe(false);
  });

  it("never reuses a payment that is paid or cancelled", () => {
    expect(isReusableFor(intent({ status: "succeeded" }), 18500, Currency.PLN)).toBe(false);
    expect(isReusableFor(intent({ status: "canceled" }), 18500, Currency.PLN)).toBe(false);
  });
});

describe("getPaymentMethodLabel", () => {
  it("names the method for the WooCommerce panel", () => {
    expect(getPaymentMethodLabel(method("card"))).toBe("Karta");
    expect(getPaymentMethodLabel(method("blik"))).toBe("BLIK");
    expect(getPaymentMethodLabel(method("klarna"))).toBe("Klarna");
  });

  it("recognises Apple Pay and Google Pay inside a card payment", () => {
    expect(getPaymentMethodLabel(method("card", "apple_pay"))).toBe("Apple Pay");
    expect(getPaymentMethodLabel(method("card", "google_pay"))).toBe("Google Pay");
  });

  it("keeps Stripe's name for a method it does not know", () => {
    expect(getPaymentMethodLabel(method("revolut_pay"))).toBe("revolut_pay");
  });
});
