import { describe, expect, it } from "vitest";
import { Address } from "@/contracts/server/cart";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { getBillingAddress, getDeliverySnapshot, parsePlacedOrder } from "./checkout";

const address: Address = {
  firstName: "Test",
  lastName: "Kasa",
  email: "delivered@resend.dev",
  phone: "500100200",
  street: "Testowa 1",
  street2: "m. 4",
  city: "Berlin",
  postcode: "10115",
  country: "DE",
  note: "",
};

const locker = {
  code: "POP-WAW708",
  description: "Nowy Świat 0/POZ.-1 L.U1012",
  city: "Warszawa",
  postCode: "00-046",
};

describe("getBillingAddress", () => {
  it("uses the typed address for a courier", () => {
    expect(getBillingAddress(address, null)).toMatchObject({
      address_1: "Testowa 1",
      address_2: "m. 4",
      city: "Berlin",
      postcode: "10115",
      country: "DE",
    });
  });

  it("uses the parcel locker as the address", () => {
    expect(getBillingAddress({ ...address, country: "PL" }, locker)).toMatchObject({
      address_1: "Nowy Świat 0/POZ.-1 L.U1012",
      address_2: "",
      city: "Warszawa",
      postcode: "00-046",
      country: "PL",
    });
  });
});

describe("getDeliverySnapshot", () => {
  it("changes when anything the order depends on changes", () => {
    const placed = getDeliverySnapshot(address, DeliveryMethod.Courier, null);
    expect(getDeliverySnapshot({ ...address }, DeliveryMethod.Courier, null)).toBe(placed);
    expect(getDeliverySnapshot({ ...address, city: "Hamburg" }, DeliveryMethod.Courier, null)).not.toBe(placed);
    expect(getDeliverySnapshot(address, DeliveryMethod.Locker, locker)).not.toBe(placed);
  });
});

describe("parsePlacedOrder", () => {
  it("reads back an order remembered in the tab", () => {
    expect(parsePlacedOrder('{"id":317,"key":"wc_order_x","number":"317"}')).toEqual({
      id: 317,
      key: "wc_order_x",
      number: "317",
    });
  });

  it("ignores anything else", () => {
    expect(parsePlacedOrder(null)).toBeNull();
    expect(parsePlacedOrder("not json")).toBeNull();
    expect(parsePlacedOrder('{"id":"317","key":"x","number":"317"}')).toBeNull();
  });
});
