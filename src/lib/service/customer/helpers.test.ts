import { describe, expect, it } from "vitest";
import { RawWcCustomer, SavedAddress, SavedLocker } from "@/contracts/server/auth";
import {
  ADDRESSES_META_KEY,
  BILLING_ADDRESS_ID,
  LOCKERS_META_KEY,
  prepareCustomer,
  putSavedAddress,
  putSavedLocker,
  removeSavedLocker,
} from "./helpers";

const raw = (overrides: Partial<RawWcCustomer> = {}): RawWcCustomer => ({
  id: 12,
  email: "klient@example.com",
  first_name: "Natalia",
  last_name: "Wasiluk",
  ...overrides,
});

const address = (id: string, street: string): SavedAddress => ({
  id,
  firstName: "Natalia",
  lastName: "Wasiluk",
  phone: "",
  street,
  street2: "",
  postcode: "05-077",
  city: "Warszawa",
  country: "PL",
});

const locker = (code: string): SavedLocker => ({
  code,
  description: "",
  city: "Warszawa",
  postCode: "",
  country: "PL",
});

describe("saved addresses from WooCommerce", () => {
  it("keeps the address from the old form until the list is saved", () => {
    const customer = prepareCustomer(
      raw({
        billing: {
          first_name: "Natalia",
          last_name: "Wasiluk",
          address_1: "Biesiadna 4/30",
          postcode: "05-077",
          city: "Warszawa",
          country: "PL",
        },
      })
    );
    expect(customer.addresses).toEqual([
      expect.objectContaining({ id: BILLING_ADDRESS_ID, street: "Biesiadna 4/30" }),
    ]);
  });

  it("stays empty once the customer deleted every address", () => {
    const customer = prepareCustomer(
      raw({
        billing: { address_1: "Biesiadna 4/30", country: "PL" },
        meta_data: [{ key: ADDRESSES_META_KEY, value: [] }],
      })
    );
    expect(customer.addresses).toEqual([]);
  });

  it("reads lists stored as JSON text and skips broken entries", () => {
    const customer = prepareCustomer(
      raw({
        meta_data: [
          {
            key: ADDRESSES_META_KEY,
            value: JSON.stringify([address("a1", "Polna 2"), { id: "x" }, "nonsense"]),
          },
          { key: LOCKERS_META_KEY, value: [locker("WAW01M"), { code: "" }] },
        ],
      })
    );
    expect(customer.addresses.map((saved) => saved.id)).toEqual(["a1"]);
    expect(customer.lockers.map((saved) => saved.code)).toEqual(["WAW01M"]);
  });
});

describe("changing the saved lists", () => {
  it("puts a new address on top and keeps an edited one in its place", () => {
    const list = [address("a1", "Polna 2"), address("a2", "Leśna 3")];
    expect(putSavedAddress(list, address("a3", "Nowa 1")).map((saved) => saved.id)).toEqual([
      "a3",
      "a1",
      "a2",
    ]);
    const edited = putSavedAddress(list, address("a2", "Leśna 5"));
    expect(edited.map((saved) => saved.street)).toEqual(["Polna 2", "Leśna 5"]);
  });

  it("puts a new locker on top, never twice", () => {
    const list = [locker("WAW01M"), locker("KRA01M")];
    expect(putSavedLocker(list, locker("POZ01M")).map((saved) => saved.code)).toEqual([
      "POZ01M",
      "WAW01M",
      "KRA01M",
    ]);
    expect(putSavedLocker(list, locker("KRA01M")).map((saved) => saved.code)).toEqual([
      "KRA01M",
      "WAW01M",
    ]);
  });

  it("swaps a changed locker in its place", () => {
    const list = [locker("WAW01M"), locker("KRA01M"), locker("GDA01M")];
    expect(putSavedLocker(list, locker("POZ01M"), "KRA01M").map((saved) => saved.code)).toEqual([
      "WAW01M",
      "POZ01M",
      "GDA01M",
    ]);
  });

  it("removes a locker by its code", () => {
    expect(removeSavedLocker([locker("WAW01M"), locker("KRA01M")], "WAW01M")).toEqual([
      locker("KRA01M"),
    ]);
  });
});
