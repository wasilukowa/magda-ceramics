import { expect, openFirstAvailableProduct, test } from "./fixtures";

// Strony, które klient może otworzyć bez logowania, w obu językach.
const PAGES = [
  { pl: "/pl", en: "/en" },
  { pl: "/pl/sklep", en: "/en/shop" },
  { pl: "/pl/sklep/archiwum", en: "/en/shop/archive" },
  { pl: "/pl/o-mnie", en: "/en/about" },
  { pl: "/pl/o-mnie/moja-ceramika", en: "/en/about/my-ceramics" },
  { pl: "/pl/opinie", en: "/en/reviews" },
  { pl: "/pl/pytania-i-odpowiedzi", en: "/en/faq" },
  { pl: "/pl/wysylka-i-zwroty", en: "/en/shipping-and-returns" },
  { pl: "/pl/regulamin", en: "/en/terms" },
  { pl: "/pl/polityka-prywatnosci", en: "/en/privacy" },
  { pl: "/pl/pliki-cookies", en: "/en/cookies" },
  { pl: "/pl/mapa-strony", en: "/en/sitemap" },
  { pl: "/pl/kontakt", en: "/en/contact" },
  { pl: "/pl/logowanie", en: "/en/login" },
  { pl: "/pl/rejestracja", en: "/en/register" },
  { pl: "/pl/ulubione", en: "/en/wishlist" },
  { pl: "/pl/checkout", en: "/en/checkout" },
];

test.describe("every page opens", () => {
  for (const { pl, en } of PAGES) {
    for (const [locale, path] of [["pl", pl], ["en", en]] as const) {
      test(path, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
      });
    }
  }
});

test("an unknown address shows the not-found page and stays out of Google", async ({ page }) => {
  await page.goto("/pl/nie-ma-takiej-strony");
  await expect(page.getByText("Nie znaleźliśmy tej strony")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
});

test("old addresses without a language move to the right one", async ({ page }) => {
  for (const [from, to] of [
    ["/o-mnie", "/pl/o-mnie"],
    ["/about", "/en/about"],
    ["/sklep", "/pl/sklep"],
  ]) {
    const response = await page.request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(new URL(response.headers().location, "http://x").pathname, from).toBe(to);
  }
});

test("the shop is closed to visitors without the preview cookie", async ({ browser, baseURL }) => {
  const visitor = await browser.newContext({ baseURL });
  const page = await visitor.newPage();
  await page.goto("/pl/sklep");
  await expect(page).toHaveURL(/\/coming-soon$/);
  await visitor.close();
});

test("a product page shows the price and data for Google", async ({ page }) => {
  await openFirstAvailableProduct(page);
  await expect(page.getByText(/\d+(\.\d{2})? zł/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Dodaj do koszyka" })).toBeVisible();
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join("")).toContain('"@type":"Product"');
});

test("the English shop shows prices in euro", async ({ page }) => {
  await page.goto("/en/shop");
  await expect(page.locator("main").getByText(/\d+(\.\d{2})? €/).first()).toBeVisible();
  await expect(page.locator("main").getByText(/\d zł/)).toHaveCount(0);
});

// Suwak na głównej pobiera zdjęcia dopiero, gdy są potrzebne (2026-10-19) —
// następne i to „przez koniec" muszą się mimo to pokazać.
test("the home slider loads only nearby photos and still shows the next ones", async ({ page }) => {
  const photo = (number: number) => page.getByAltText(`Ceramika Magdy, zdjęcie ${number}`, { exact: true });
  await page.goto("/pl");
  await expect(photo(1)).toBeVisible();
  await expect(page.getByAltText(/^Ceramika Magdy, zdjęcie/)).toHaveCount(3);

  await page.getByRole("button", { name: "Następne zdjęcie" }).click();
  await expect(photo(2)).toHaveJSProperty("complete", true);
  expect(await photo(2).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Poprzednie zdjęcie" }).click();
  await page.getByRole("button", { name: "Poprzednie zdjęcie" }).click();
  await expect(page.getByAltText(/^Ceramika Magdy, zdjęcie/).last()).toHaveJSProperty("complete", true);
});
