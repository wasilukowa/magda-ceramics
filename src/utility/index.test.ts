import { describe, expect, it } from "vitest";
import { isEmailAddress, isPhoneNumber, isPlacedCheckout } from "./index";

describe("isPhoneNumber", () => {
  it("accepts real-looking numbers in any common format", () => {
    expect(isPhoneNumber("500100200")).toBe(true);
    expect(isPhoneNumber("+48 500 100 200")).toBe(true);
    expect(isPhoneNumber("(030) 1234-5678")).toBe(true);
  });

  it("refuses placeholders and too short or too long numbers", () => {
    expect(isPhoneNumber("-")).toBe(false);
    expect(isPhoneNumber("brak")).toBe(false);
    expect(isPhoneNumber("12345")).toBe(false);
    expect(isPhoneNumber("1234567890123456")).toBe(false);
  });
});

describe("isEmailAddress", () => {
  it("accepts something@something.domain", () => {
    expect(isEmailAddress("delivered@resend.dev")).toBe(true);
    expect(isEmailAddress("  delivered@resend.dev  ")).toBe(true);
  });

  it("refuses incomplete addresses", () => {
    expect(isEmailAddress("delivered@resend")).toBe(false);
    expect(isEmailAddress("delivered resend.dev")).toBe(false);
    expect(isEmailAddress("")).toBe(false);
  });
});

describe("isPlacedCheckout", () => {
  it("tells a placed order from a refusal", () => {
    expect(isPlacedCheckout({ orderId: 317, key: "wc_order_x", number: "317" })).toBe(true);
    expect(isPlacedCheckout({ error: "unavailable" })).toBe(false);
    expect(isPlacedCheckout(null)).toBe(false);
  });
});
