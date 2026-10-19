import { describe, expect, it } from "vitest";
import { parseStoredCart } from "./cart";

const item = (overrides: Record<string, unknown> = {}) => ({
  id: 581,
  slug: "kubek-laka",
  name: "Kubek Łąka",
  price: "110",
  image: "https://example.com/laka.jpg",
  quantity: 1,
  ...overrides,
});

describe("parseStoredCart", () => {
  it("keeps a valid cart as it was", () => {
    const cart = [item(), item({ id: 580, slug: "swiecznik-laka", price: "60", locale: "pl" })];
    expect(parseStoredCart(JSON.stringify(cart))).toEqual(cart);
  });

  it("drops broken entries and keeps the rest", () => {
    const stored = [
      item(),
      item({ id: 2, price: "abc" }),
      item({ id: 3, quantity: 0 }),
      item({ id: "4" }),
      item({ id: 5, name: null }),
      null,
      "kubek",
    ];
    expect(parseStoredCart(JSON.stringify(stored)).map((entry) => entry.id)).toEqual([581]);
  });

  it("keeps each piece once — every work is one of a kind", () => {
    expect(parseStoredCart(JSON.stringify([item(), item()]))).toHaveLength(1);
  });

  it("treats anything other than a list as an empty cart", () => {
    expect(parseStoredCart(JSON.stringify({ items: [item()] }))).toEqual([]);
  });
});
