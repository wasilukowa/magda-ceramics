import { type Page } from "@playwright/test";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { formatPrice, getUnitPrice } from "@/lib/helpers/currency";
import { getShippingCost } from "@/lib/helpers/shipping";
import { expect, test } from "./fixtures";
import {
  CUSTOMER,
  MESSAGES,
  addToCart,
  chooseLocker,
  fillContact,
  startGuestCheckout,
  type Locale,
} from "./support/checkout";
import { getAvailableProducts } from "./support/woocommerce";

// Koszyk i kasa BEZ składania zamówienia — przycisk „Złóż zamówienie"
// klikany jest tylko przy brakujących danych, kiedy sklep go zatrzymuje.

// Ramka „Podsumowanie" z prawej (w pasku kroków ten sam napis stoi w <span>).
const summary = (page: Page, locale: Locale) =>
  page
    .locator("p")
    .getByText(MESSAGES[locale].checkout.summary, { exact: true })
    .locator("..");

// Podsumowanie w kasie: wysyłka i „Razem" dla jednej pracy.
const expectTotals = async (
  page: Page,
  locale: Locale,
  price: string,
  country: string,
  method: DeliveryMethod
) => {
  const currency = locale === "pl" ? Currency.PLN : Currency.EUR;
  const shipping = getShippingCost(country, currency, method);
  const total = getUnitPrice({ price }, currency) + shipping;
  const box = summary(page, locale);
  await expect(box).toContainText(formatPrice(shipping, currency));
  await expect(box).toContainText(formatPrice(total, currency));
};

let product: { slug: string; name: string; price: string };

test.beforeAll(async () => {
  [product] = await getAvailableProducts(1);
});

test("the cart keeps a work until it is removed", async ({ page }) => {
  const t = MESSAGES.pl.cart;
  await addToCart(page, "pl", product.slug);
  await expect(page.getByRole("button", { name: t.close })).toBeVisible();
  await expect(page.getByRole("link", { name: t.checkout })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: MESSAGES.pl.nav.cart, exact: true }).click();
  const remove = page.getByRole("button", { name: t.removeItem.replace("{name}", product.name) });
  await expect(remove).toBeVisible();

  await remove.click();
  await expect(page.getByText(t.empty)).toBeVisible();
});

test("checkout asks for the missing details step by step", async ({ page }) => {
  const t = MESSAGES.pl.checkout;
  await addToCart(page, "pl", product.slug);
  await startGuestCheckout(page, "pl");

  // Krok 1: dane kontaktowe.
  await page.getByRole("button", { name: t.continue }).click();
  await expect(page.getByText(t.fillRequired)).toBeVisible();
  await page.getByLabel(t.firstName, { exact: true }).fill(CUSTOMER.firstName);
  await page.getByLabel(t.lastName, { exact: true }).fill(CUSTOMER.lastName);
  await page.getByLabel(t.emailLabel, { exact: true }).fill("to-nie-jest-mail");
  await page.getByRole("button", { name: t.continue }).click();
  await expect(page.getByText(t.emailInvalid)).toBeVisible();
  await page.getByLabel(t.emailLabel, { exact: true }).fill(CUSTOMER.email);
  await page.getByRole("button", { name: t.continue }).click();

  // Krok 2: paczkomat bez wybranego punktu i ze złym telefonem.
  await expect(page.getByText(t.shippingAddress)).toBeVisible();
  await expectTotals(page, "pl", product.price, "PL", DeliveryMethod.Locker);
  await page.getByLabel(t.phoneRequired, { exact: true }).fill("12");
  await expect(page.getByText(t.phoneInvalid)).toBeVisible();
  await page.getByRole("button", { name: t.placeOrder }).click();
  await expect(page.getByText(t.lockerRequired)).toBeVisible();

  // Kurier bez adresu.
  await page.getByRole("button", { name: new RegExp(`^${t.methodCourier}`) }).click();
  await expectTotals(page, "pl", product.price, "PL", DeliveryMethod.Courier);
  await page.getByRole("button", { name: t.placeOrder }).click();
  await expect(page.getByText(t.fillRequired)).toBeVisible();

  // Wstecz nie gubi wpisanych danych.
  await page.getByRole("button", { name: t.back }).click();
  await expect(page.getByLabel(t.emailLabel, { exact: true })).toHaveValue(CUSTOMER.email);
});

test("shipping price follows the country", async ({ page }) => {
  const t = MESSAGES.pl.checkout;
  await addToCart(page, "pl", product.slug);
  await startGuestCheckout(page, "pl");
  await fillContact(page, "pl");

  // Nazwa listy to napis i wybrany kraj („Kraj * Polska").
  const country = page.getByLabel(t.country);
  const methodLocker = page.getByRole("button", { name: new RegExp(`^${t.methodLocker}`) });

  // Francja: paczkomat InPost International albo kurier.
  await country.selectOption("FR");
  await expect(methodLocker).toBeVisible();
  await expectTotals(page, "pl", product.price, "FR", DeliveryMethod.Locker);

  // Niemcy i Wielka Brytania: tylko kurier.
  for (const code of ["DE", "GB"]) {
    await country.selectOption(code);
    await expect(methodLocker).toBeHidden();
    await expectTotals(page, "pl", product.price, code, DeliveryMethod.Courier);
  }
});

test("the English checkout charges in euro", async ({ page }) => {
  const t = MESSAGES.en.checkout;
  await addToCart(page, "en", product.slug);
  await startGuestCheckout(page, "en");
  await fillContact(page, "en");
  await page.getByLabel(t.country).selectOption("DE");
  await expectTotals(page, "en", product.price, "DE", DeliveryMethod.Courier);
});

test("a parcel locker is picked on the map", async ({ page }) => {
  const t = MESSAGES.pl.checkout;
  await addToCart(page, "pl", product.slug);
  await startGuestCheckout(page, "pl");
  await fillContact(page, "pl");

  // Dwa razy — za drugim razem mapa kładła kiedyś całą kasę.
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: t.chooseLocker }).click();
    await expect(page.locator("inpost-geowidget")).toBeAttached({ timeout: 30_000 });
    await page.getByRole("button", { name: t.closeLocker }).click();
    await expect(page.locator("inpost-geowidget")).toHaveCount(0);
  }

  await chooseLocker(page, "WAW01M");
  await expect(summary(page, "pl")).toContainText(t.summaryDeliveryLocker);

  // Gość nie ma konta, w którym mógłby paczkomat zapisać.
  await expect(page.getByRole("button", { name: t.addToMyLockers })).toBeDisabled();
  await expect(page.getByText(t.saveNeedsLogin)).toBeVisible();
});
