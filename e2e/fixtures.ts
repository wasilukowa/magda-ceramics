import { test as base, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import {
  CONSENT_COOKIE_NAME,
  REJECTED_CHOICES,
  createConsent,
  serializeConsentCookie,
} from "@/lib/helpers/consent";

// Ciasteczko, które otwiera sklep za bramką „Wkrótce" (patrz src/proxy.ts).
const GATE_COOKIE = { name: "preview_access", value: "true" };

// Klient, który już przeszedł bramkę i zamknął baner cookies.
const enterShop = (context: BrowserContext, baseURL: string) =>
  context.addCookies([
    { ...GATE_COOKIE, url: baseURL },
    {
      name: CONSENT_COOKIE_NAME,
      value: serializeConsentCookie(createConsent(REJECTED_CHOICES)),
      url: baseURL,
    },
  ]);

// Drugi klient w tym samym teście — osobna przeglądarka z własnym koszykiem.
export const newCustomer = async (browser: Browser, baseURL: string): Promise<Page> => {
  const context = await browser.newContext({ baseURL });
  await enterShop(context, baseURL);
  return context.newPage();
};

// Każdy test zaczyna jak klient, który już przeszedł bramkę i zamknął baner
// cookies. Błąd JavaScriptu na stronie (np. ten, przez który mapa paczkomatów
// kładła całą kasę) oblewa test, nawet jeśli strona wygląda dobrze.
// (Drugi argument fixture'a to w Playwright zwykle `use` — tu `provide`, bo
// ESLint bierze `use` za hook Reacta.)
export const test = base.extend<{ pageErrors: Error[] }>({
  context: async ({ context, baseURL }, provide) => {
    await enterShop(context, baseURL!);
    await provide(context);
  },
  pageErrors: [
    async ({ page }, provide) => {
      const errors: Error[] = [];
      page.on("pageerror", (error) => errors.push(error));
      await provide(errors);
      expect(errors, "błędy JavaScriptu na stronie").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

// Pierwsza praca w sklepie, którą da się kupić — otwiera jej stronę.
export const openFirstAvailableProduct = async (page: Page, shopPath = "/pl/sklep") => {
  await page.goto(shopPath);
  await page.locator("main a[href*='/produkt/'], main a[href*='/product/']").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};
