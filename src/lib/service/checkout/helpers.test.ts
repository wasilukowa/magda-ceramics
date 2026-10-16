import { describe, expect, it } from "vitest";
import { BillingAddress } from "@/contracts/server/cart";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { getDeliveryFields, placeOrderRequestSchema } from "./helpers";

const billing: BillingAddress = {
  first_name: "Test",
  last_name: "Kasa",
  email: "delivered@resend.dev",
  phone: "500 100 200",
  address_1: "Testowa 1",
  address_2: "",
  city: "Warszawa",
  postcode: "00-001",
  country: "PL",
};

const locker = {
  code: "POP-WAW708",
  description: "Nowy Świat 0/POZ.-1 L.U1012",
  city: "Warszawa",
  postCode: "00-046",
};

const placeOrder = (overrides: Record<string, unknown> = {}) => ({
  billing,
  deliveryMethod: DeliveryMethod.Courier,
  items: [{ id: 174, quantity: 1 }],
  currency: Currency.PLN,
  checkoutId: "6d9846fe-b3df-4f05-9139-5320693a8dc1",
  locale: "pl",
  ...overrides,
});

describe("placeOrderRequestSchema", () => {
  it("accepts a complete courier order", () => {
    expect(placeOrderRequestSchema.safeParse(placeOrder()).success).toBe(true);
  });

  it("requires a phone number for a parcel locker", () => {
    const withoutPhone = placeOrder({
      billing: { ...billing, phone: "" },
      deliveryMethod: DeliveryMethod.Locker,
      locker,
    });
    expect(placeOrderRequestSchema.safeParse(withoutPhone).success).toBe(false);
    expect(
      placeOrderRequestSchema.safeParse({ ...withoutPhone, billing }).success
    ).toBe(true);
  });

  it("refuses countries the shop does not ship to", () => {
    const abroad = placeOrder({ billing: { ...billing, country: "US" } });
    expect(placeOrderRequestSchema.safeParse(abroad).success).toBe(false);
  });

  it("refuses an empty cart and the same piece twice", () => {
    expect(placeOrderRequestSchema.safeParse(placeOrder({ items: [] })).success).toBe(false);
    const twice = placeOrder({
      items: [
        { id: 174, quantity: 1 },
        { id: 174, quantity: 1 },
      ],
    });
    expect(placeOrderRequestSchema.safeParse(twice).success).toBe(false);
  });

  it("drops prices sent by the browser", () => {
    const parsed = placeOrderRequestSchema.parse(
      placeOrder({ items: [{ id: 174, quantity: 1, price: "1" }] })
    );
    expect(parsed.items).toEqual([{ id: 174, quantity: 1 }]);
  });
});

describe("getDeliveryFields", () => {
  it("ships a locker order to the point, with its code for the studio", () => {
    const fields = getDeliveryFields({
      billing,
      note: "Proszę o ostrożność",
      deliveryMethod: DeliveryMethod.Locker,
      locker,
    });

    expect(fields.shipping).toMatchObject({
      company: "Paczkomat POP-WAW708",
      address_1: "Nowy Świat 0/POZ.-1 L.U1012",
      address_2: "",
      city: "Warszawa",
      postcode: "00-046",
    });
    expect(fields.shippingLine).toEqual({
      method_id: "flat_rate",
      method_title: "Paczkomat InPost POP-WAW708",
      total: "20.00",
    });
    expect(fields.customerNote).toBe(
      "Proszę o ostrożność\nPaczkomat InPost: POP-WAW708 (Nowy Świat 0/POZ.-1 L.U1012)"
    );
    expect(fields.lockerCode).toBe("POP-WAW708");
  });

  it("ships a courier order to the typed address at the courier rate", () => {
    const fields = getDeliveryFields({
      billing: { ...billing, country: "GB" },
      note: "",
      deliveryMethod: DeliveryMethod.Courier,
      locker: null,
    });

    expect(fields.shipping.address_1).toBe("Testowa 1");
    expect(fields.shippingLine.total).toBe("95.00");
    expect(fields.customerNote).toBe("");
    expect(fields.lockerCode).toBeNull();
  });
});
