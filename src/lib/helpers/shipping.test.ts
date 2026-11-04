import { describe, expect, it } from "vitest";
import { DeliveryMethod, PostcodeIssue, ShippingZone } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import {
  getCountryLabel,
  getInPostPoint,
  getLowestShippingCost,
  getPostcodeIssue,
  getRegionStateName,
  getShippingCost,
  getShippingCostInZloty,
  getShippingZoneSummaries,
  getShopCountry,
  hasInPostLocker,
  isCheckoutCountry,
  isPostcodeInCountry,
  resolveDeliveryMethod,
  toPostalCountry,
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

  it("prices shipping in pounds", () => {
    expect(getShippingCost("PL", Currency.GBP, DeliveryMethod.Locker)).toBe(4);
    expect(getShippingCost("FR", Currency.GBP, DeliveryMethod.Locker)).toBe(10);
    expect(getShippingCost("FR", Currency.GBP, DeliveryMethod.Courier)).toBe(16);
    expect(getShippingCost("DE", Currency.GBP, DeliveryMethod.Courier)).toBe(11);
    expect(getShippingCost("GB", Currency.GBP, DeliveryMethod.Courier)).toBe(18);
  });

  it("records shipping in złoty whatever the paid currency", () => {
    expect(getShippingCostInZloty("DE", DeliveryMethod.Courier)).toBe(55);
    expect(getShippingCostInZloty("NL", DeliveryMethod.Locker)).toBe(50);
  });
});

describe("getLowestShippingCost", () => {
  it("takes the parcel locker where there is one, otherwise the courier", () => {
    expect(getLowestShippingCost("PL", Currency.PLN)).toBe(20);
    expect(getLowestShippingCost("FR", Currency.PLN)).toBe(50);
    expect(getLowestShippingCost("FR", Currency.EUR)).toBe(11.5);
    expect(getLowestShippingCost("AT", Currency.EUR)).toBe(12);
    expect(getLowestShippingCost("GB", Currency.GBP)).toBe(18);
    expect(getLowestShippingCost("SE", Currency.PLN)).toBe(80);
  });
});

describe("Ireland and Northern Ireland (2026-11-04)", () => {
  it("ships to both by courier only, at Natalia's euro rates", () => {
    expect(getShippingCost("XI", Currency.EUR, DeliveryMethod.Courier)).toBe(20);
    expect(getShippingCost("IE", Currency.EUR, DeliveryMethod.Courier)).toBe(25);
    expect(hasInPostLocker("XI")).toBe(false);
    expect(hasInPostLocker("IE")).toBe(false);
    expect(resolveDeliveryMethod("IE", DeliveryMethod.Locker, true)).toBe(DeliveryMethod.Courier);
  });

  it("derives złoty and pounds by the usual rule", () => {
    // 20 € × 4,30 = 86 → 90 zł → / 5,20 = 17,31 → 18 £
    expect(getShippingCost("XI", Currency.PLN, DeliveryMethod.Courier)).toBe(90);
    expect(getShippingCost("XI", Currency.GBP, DeliveryMethod.Courier)).toBe(18);
    // 25 € × 4,30 = 107,50 → 110 zł → / 5,20 = 21,15 → 22 £
    expect(getShippingCostInZloty("IE", DeliveryMethod.Courier)).toBe(110);
    expect(getShippingCost("IE", Currency.GBP, DeliveryMethod.Courier)).toBe(22);
  });

  it("names Northern Ireland, which Intl does not know", () => {
    expect(getCountryLabel("XI", "pl")).toBe("Irlandia Północna");
    expect(getCountryLabel("XI", "en")).toBe("Northern Ireland");
    expect(getCountryLabel("IE", "pl")).toBe("Irlandia");
    expect(getCountryLabel("GB", "pl")).toBe("Wielka Brytania");
  });

  it("sends Northern Ireland out as the United Kingdom", () => {
    expect(toPostalCountry("XI")).toBe("GB");
    expect(toPostalCountry("IE")).toBe("IE");
    expect(getRegionStateName("XI")).toBe("Northern Ireland");
    expect(getRegionStateName("GB")).toBeNull();
  });

  it("reads a UK address with a BT postcode back as Northern Ireland", () => {
    expect(getShopCountry("GB", "bt7 1nn")).toBe("XI");
    expect(getShopCountry("GB", "SW1A 1AA")).toBe("GB");
    expect(getShopCountry("IE", "D02 X285")).toBe("IE");
  });

  it("keeps BT postcodes in Northern Ireland and out of the rest of the UK", () => {
    expect(isPostcodeInCountry("XI", "BT1 1AA")).toBe(true);
    expect(isPostcodeInCountry("XI", "SW1A 1AA")).toBe(false);
    expect(isPostcodeInCountry("XI", "")).toBe(false);
    expect(isPostcodeInCountry("GB", "BT1 1AA")).toBe(false);
    expect(isPostcodeInCountry("GB", "SW1A 1AA")).toBe(true);
    expect(isPostcodeInCountry("PL", "00-046")).toBe(true);

    expect(getPostcodeIssue("XI", "SW1A")).toBe(PostcodeIssue.OutsideRegion);
    expect(getPostcodeIssue("GB", "BT1")).toBe(PostcodeIssue.InsideRegion);
    // Pod polem w kasie niedokończony kod nie jest jeszcze błędem.
    expect(getPostcodeIssue("XI", "B", true)).toBeNull();
    expect(getPostcodeIssue("XI", "B")).toBe(PostcodeIssue.OutsideRegion);
  });

  it("lists both on the shipping page, cheapest first", () => {
    const zones = getShippingZoneSummaries().map(({ zone }) => zone);
    expect(zones.slice(-3)).toEqual([
      ShippingZone.NorthernIreland,
      ShippingZone.UnitedKingdom,
      ShippingZone.Ireland,
    ]);
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
