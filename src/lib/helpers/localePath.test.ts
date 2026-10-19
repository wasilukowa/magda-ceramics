import { describe, expect, it } from "vitest";
import { hasLocalePrefix, localeOfUnprefixedPath } from "./localePath";

describe("hasLocalePrefix", () => {
  it("recognises addresses that already carry a language", () => {
    expect(hasLocalePrefix("/pl")).toBe(true);
    expect(hasLocalePrefix("/pl/sklep")).toBe(true);
    expect(hasLocalePrefix("/en/about")).toBe(true);
  });

  it("does not mistake a word starting with pl or en for a prefix", () => {
    expect(hasLocalePrefix("/about")).toBe(false);
    expect(hasLocalePrefix("/plan")).toBe(false);
    expect(hasLocalePrefix("/engraving")).toBe(false);
  });
});

describe("localeOfUnprefixedPath", () => {
  it("sends old English links to the English site", () => {
    expect(localeOfUnprefixedPath("/about")).toBe("en");
    expect(localeOfUnprefixedPath("/order")).toBe("en");
    expect(localeOfUnprefixedPath("/product/kubek-laka")).toBe("en");
  });

  it("sends Polish words to the Polish site", () => {
    expect(localeOfUnprefixedPath("/sklep")).toBe("pl");
    expect(localeOfUnprefixedPath("/o-mnie")).toBe("pl");
    expect(localeOfUnprefixedPath("/zamowienie")).toBe("pl");
    expect(localeOfUnprefixedPath("/produkt/kubek-laka")).toBe("pl");
    expect(localeOfUnprefixedPath("/sklep/archiwum")).toBe("pl");
  });

  it("keeps the default language for shared and unknown addresses", () => {
    expect(localeOfUnprefixedPath("/checkout")).toBe("en");
    expect(localeOfUnprefixedPath("/nie-ma-takiej-strony")).toBe("en");
  });
});
