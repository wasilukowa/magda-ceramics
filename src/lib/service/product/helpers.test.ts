import { describe, expect, it } from "vitest";
import { CategoryProps } from "@/contracts/server/product";
import { pickShopBarCategories } from "./helpers";

const category = (id: number, slug: string): CategoryProps => ({
  id,
  name: slug,
  slug,
  count: 1,
  image: null,
});

const ALL = [category(19, "czarki"), category(18, "kubki"), category(16, "swieczniki")];

describe("shop category bar", () => {
  it("shows the same categories as the menu", () => {
    const navigation = [category(18, "kubki"), category(19, "czarki")];
    expect(pickShopBarCategories(ALL, navigation).map((c) => c.slug)).toEqual([
      "czarki",
      "kubki",
    ]);
  });

  it("keeps the category you are on, even when it is sold out", () => {
    const navigation = [category(18, "kubki")];
    expect(pickShopBarCategories(ALL, navigation, "swieczniki").map((c) => c.slug)).toEqual([
      "kubki",
      "swieczniki",
    ]);
  });

  it("shows nothing but „all” when the menu is empty (WooCommerce down)", () => {
    expect(pickShopBarCategories(ALL, [])).toEqual([]);
  });
});
