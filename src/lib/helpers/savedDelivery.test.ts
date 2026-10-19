import { describe, expect, it } from "vitest";
import { Address } from "@/contracts/server/cart";
import { SavedAddress, SavedDelivery, SavedLocker } from "@/contracts/server/auth";
import { DeliveryMethod } from "@/contracts/server/shipping";
import {
  findSavedAddress,
  getAddressLines,
  getCheckoutPrefill,
  getLockerLines,
} from "./savedDelivery";

const HOME: SavedAddress = {
  id: "a1",
  firstName: "Natalia",
  lastName: "Wasiluk",
  phone: "500600700",
  street: "Biesiadna 4/30",
  street2: "",
  postcode: "05-077",
  city: "Warszawa",
  country: "PL",
};

const WAW: SavedLocker = {
  code: "WAW01M",
  description: "Marszałkowska 1",
  city: "Warszawa",
  postCode: "00-001",
  country: "PL",
};

const PARIS: SavedLocker = {
  code: "FR021607",
  description: "Rue de Rivoli 1",
  city: "Paris",
  postCode: "75001",
  country: "FR",
};

const EMPTY: Address = {
  firstName: "",
  lastName: "",
  email: "klient@example.com",
  phone: "",
  street: "",
  street2: "",
  city: "",
  postcode: "",
  country: "PL",
  note: "",
};

const saved = (overrides: Partial<SavedDelivery> = {}): SavedDelivery => ({
  firstName: "Natalia",
  lastName: "Wasiluk",
  addresses: [],
  lockers: [],
  ...overrides,
});

describe("saved address on screen", () => {
  it("reads like an envelope, without the country at home", () => {
    expect(getAddressLines(HOME, "pl")).toEqual([
      "Natalia Wasiluk",
      "Biesiadna 4/30",
      "05-077 Warszawa",
    ]);
  });

  it("names the country of a foreign address", () => {
    const berlin = { ...HOME, street: "Unter den Linden 1", postcode: "10117", city: "Berlin", country: "DE" };
    expect(getAddressLines(berlin, "pl").at(-1)).toBe("Niemcy");
  });

  it("shows the street and town under a locker", () => {
    expect(getLockerLines(WAW, "pl")).toEqual(["Marszałkowska 1", "00-001 Warszawa"]);
    expect(getLockerLines(PARIS, "en").at(-1)).toBe("France");
  });
});

describe("matching a typed address", () => {
  it("ignores letter case, extra spaces and spaces in the postcode", () => {
    const typed = { ...HOME, street: " biesiadna  4/30", postcode: "05 077", city: "WARSZAWA" };
    expect(findSavedAddress([HOME], typed)?.id).toBe("a1");
  });

  it("treats another flat as another address", () => {
    expect(findSavedAddress([HOME], { ...HOME, street: "Biesiadna 4/31" })).toBeUndefined();
  });
});

describe("checkout filled from the account", () => {
  it("fills names, the newest address and the newest locker", () => {
    const prefill = getCheckoutPrefill(
      EMPTY,
      null,
      saved({ addresses: [HOME], lockers: [WAW] })
    );
    expect(prefill.address).toMatchObject({
      firstName: "Natalia",
      lastName: "Wasiluk",
      street: "Biesiadna 4/30",
      postcode: "05-077",
      city: "Warszawa",
      phone: "500600700",
      email: "klient@example.com",
    });
    expect(prefill.locker?.code).toBe("WAW01M");
    expect(prefill.method).toBe(DeliveryMethod.Locker);
  });

  it("goes for the courier when there is an address but no locker", () => {
    const prefill = getCheckoutPrefill(EMPTY, null, saved({ addresses: [HOME] }));
    expect(prefill.locker).toBeNull();
    expect(prefill.method).toBe(DeliveryMethod.Courier);
  });

  it("switches to the locker's country when only a locker is saved", () => {
    const prefill = getCheckoutPrefill(EMPTY, null, saved({ lockers: [PARIS] }));
    expect(prefill.address.country).toBe("FR");
    expect(prefill.locker?.code).toBe("FR021607");
    expect(prefill.method).toBe(DeliveryMethod.Locker);
  });

  it("picks a locker in the country of the address", () => {
    const prefill = getCheckoutPrefill(
      EMPTY,
      null,
      saved({ addresses: [HOME], lockers: [PARIS, WAW] })
    );
    expect(prefill.locker?.code).toBe("WAW01M");
  });

  it("never overwrites what the customer has already typed or chosen", () => {
    const typed = { ...EMPTY, firstName: "Magda", street: "Polna 2", postcode: "00-002", city: "Kraków" };
    const chosen = { code: "KRA01M", description: "", city: "Kraków", postCode: "" };
    const prefill = getCheckoutPrefill(
      typed,
      chosen,
      saved({ addresses: [HOME], lockers: [WAW] })
    );
    expect(prefill.address).toMatchObject({ firstName: "Magda", street: "Polna 2", city: "Kraków" });
    expect(prefill.locker).toBe(chosen);
    expect(prefill.method).toBeNull();
  });
});
