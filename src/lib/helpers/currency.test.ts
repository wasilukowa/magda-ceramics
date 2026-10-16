import { describe, expect, it } from "vitest";
import { CartItem } from "@/contracts/server/cart";
import { Currency } from "@/contracts/shared";
import {
  convertPlnToEur,
  formatPrice,
  getCartTotal,
  getDefaultCurrency,
  getUnitPrice,
} from "./currency";

describe("convertPlnToEur", () => {
  it("rounds up to a whole euro at 4.30 zł", () => {
    expect(convertPlnToEur(70)).toBe(17); // 16.28 €
    expect(convertPlnToEur(86)).toBe(20); // exactly 20 €
    expect(convertPlnToEur(100)).toBe(24); // 23.26 €
  });
});

describe("prices", () => {
  const items = [
    { id: 1, price: "70", quantity: 1 },
    { id: 2, price: "100", quantity: 1 },
  ] as CartItem[];

  it("prices an item in the chosen currency", () => {
    expect(getUnitPrice({ price: "70" }, Currency.PLN)).toBe(70);
    expect(getUnitPrice({ price: "70" }, Currency.EUR)).toBe(17);
  });

  it("sums the cart in the chosen currency", () => {
    expect(getCartTotal(items, Currency.PLN)).toBe(170);
    expect(getCartTotal(items, Currency.EUR)).toBe(41);
  });

  it("drops decimals only from whole amounts", () => {
    expect(formatPrice(90, Currency.PLN)).toBe("90 zł");
    expect(formatPrice(182.5, Currency.PLN)).toBe("182.50 zł");
    expect(formatPrice(11.5, Currency.EUR)).toBe("11.50 €");
  });

  it("starts the English site in euro and the Polish one in złoty", () => {
    expect(getDefaultCurrency("pl")).toBe(Currency.PLN);
    expect(getDefaultCurrency("en")).toBe(Currency.EUR);
  });
});
