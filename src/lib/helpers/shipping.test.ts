import { describe, expect, it } from "vitest";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import {
  getInPostPoint,
  getShippingCost,
  getShippingCostInZloty,
  hasInPostLocker,
  isCheckoutCountry,
  resolveDeliveryMethod,
} from "./shipping";

describe("getShippingCost", () => {
  it("charges the same for a locker and a courier in Poland", () => {
    expect(getShippingCost("PL", Currency.PLN, DeliveryMethod.Locker)).toBe(20);
    expect(getShippingCost("PL", Currency.PLN, DeliveryMethod.Courier)).toBe(20);
    expect(getShippingCost("PL", Currency.EUR, DeliveryMethod.Locker)).toBe(5);
  });

  it("makes an InPost International locker cheaper than a courier", () => {
    expect(getShippingCost("FR", Currency.PLN, DeliveryMethod.Locker)).toBe(50);
    expect(getShippingCost("FR", Currency.EUR, DeliveryMethod.Locker)).toBe(11.5);
    expect(getShippingCost("FR", Currency.PLN, DeliveryMethod.Courier)).toBe(80);
    expect(getShippingCost("FR", Currency.EUR, DeliveryMethod.Courier)).toBe(18);
  });

  it("charges the courier rate where there are no lockers", () => {
    // Austria has no InPost lockers, so a locker request still costs a courier.
    expect(getShippingCost("AT", Currency.PLN, DeliveryMethod.Locker)).toBe(55);
    expect(getShippingCost("DE", Currency.EUR, DeliveryMethod.Courier)).toBe(12);
    expect(getShippingCost("GB", Currency.PLN, DeliveryMethod.Courier)).toBe(95);
    expect(getShippingCost("GB", Currency.EUR, DeliveryMethod.Courier)).toBe(21);
  });

  it("records shipping in złoty whatever the paid currency", () => {
    expect(getShippingCostInZloty("DE", DeliveryMethod.Courier)).toBe(55);
    expect(getShippingCostInZloty("NL", DeliveryMethod.Locker)).toBe(50);
  });
});

describe("countries", () => {
  it("accepts only the countries the checkout lists", () => {
    expect(isCheckoutCountry("PL")).toBe(true);
    expect(isCheckoutCountry("GB")).toBe(true);
    expect(isCheckoutCountry("US")).toBe(false);
  });

  it("offers lockers in Poland and the InPost International countries only", () => {
    expect(hasInPostLocker("PL")).toBe(true);
    expect(hasInPostLocker("ES")).toBe(true);
    expect(hasInPostLocker("AT")).toBe(false);
    expect(hasInPostLocker("GB")).toBe(false);
  });
});

describe("resolveDeliveryMethod", () => {
  it("keeps a locker only with a chosen point in a locker country", () => {
    expect(resolveDeliveryMethod("PL", DeliveryMethod.Locker, true)).toBe(DeliveryMethod.Locker);
    expect(resolveDeliveryMethod("PL", DeliveryMethod.Locker, false)).toBe(DeliveryMethod.Courier);
    expect(resolveDeliveryMethod("AT", DeliveryMethod.Locker, true)).toBe(DeliveryMethod.Courier);
    expect(resolveDeliveryMethod("PL", undefined, true)).toBe(DeliveryMethod.Courier);
  });
});

describe("getInPostPoint", () => {
  it("keeps only the street in the description", () => {
    expect(
      getInPostPoint({
        name: "POP-WAW708",
        address: { line1: "Nowy Świat 0/POZ.-1 L.U1012", line2: "00-046 Warszawa" },
        address_details: { city: "Warszawa", post_code: "00-046" },
      })
    ).toEqual({
      code: "POP-WAW708",
      description: "Nowy Świat 0/POZ.-1 L.U1012",
      city: "Warszawa",
      postCode: "00-046",
    });
  });

  it("strips the country prefix the International widget adds", () => {
    expect(getInPostPoint({ name: "PL_POP-WAW722", country: "PL" })?.code).toBe("POP-WAW722");
    expect(getInPostPoint({ name: "FR_FR021607" })?.code).toBe("FR021607");
  });

  it("returns null when the map gives no point name", () => {
    expect(getInPostPoint({})).toBeNull();
  });
});
