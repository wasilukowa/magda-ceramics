import { expect, type Locator, type Page } from "@playwright/test";
import en from "../../messages/en.json";
import pl from "../../messages/pl.json";

// Kroki kasy tak, jak przechodzi je klient — po napisach na ekranie, w języku
// strony. Wspólne dla testów bez zamówień i z zamówieniami.

export type Locale = "pl" | "en";

export const MESSAGES = { pl, en } as const;

// Skrzynka testowa Resenda — przyjmuje wszystko i niczego nie dostarcza.
export const TEST_EMAIL = "delivered@resend.dev";

export const CUSTOMER = {
  firstName: "Test",
  lastName: "Playwright",
  email: TEST_EMAIL,
  phone: "500600700",
  street: "Testowa 1",
  postcode: "00-001",
  city: "Warszawa",
};

// Karty testowe Stripe'a — działają tylko na kluczach testowych.
export const CARD_OK = "4242424242424242";
export const CARD_DECLINED = "4000000000000002";

const productPath = (locale: Locale, slug: string) =>
  locale === "pl" ? `/pl/produkt/${slug}` : `/en/product/${slug}`;

export const addToCart = async (page: Page, locale: Locale, slug: string) => {
  const t = MESSAGES[locale];
  await page.goto(productPath(locale, slug));
  await page.getByRole("button", { name: t.addToCart.add }).click();
  await expect(page.getByRole("button", { name: t.cart.close })).toBeVisible();
};

export const startGuestCheckout = async (page: Page, locale: Locale) => {
  const t = MESSAGES[locale].checkout;
  await page.goto(`/${locale}/checkout`);
  await page.getByRole("button", { name: t.continueAsGuest }).click();
  await expect(page.getByText(t.contactDetails).first()).toBeVisible();
};

export const fillContact = async (page: Page, locale: Locale) => {
  const t = MESSAGES[locale].checkout;
  await page.getByLabel(t.firstName, { exact: true }).fill(CUSTOMER.firstName);
  await page.getByLabel(t.lastName, { exact: true }).fill(CUSTOMER.lastName);
  await page.getByLabel(t.emailLabel, { exact: true }).fill(CUSTOMER.email);
  await page.getByRole("button", { name: t.continue }).click();
  await expect(page.getByText(t.shippingAddress)).toBeVisible();
};

// Dostawa kurierem pod adres testowy (kraj zostaje ten, który jest wybrany).
export const fillCourierAddress = async (page: Page, locale: Locale, street = CUSTOMER.street) => {
  const t = MESSAGES[locale].checkout;
  const methodCourier = page.getByRole("button", { name: new RegExp(`^${t.methodCourier}`) });
  if (await methodCourier.isVisible()) await methodCourier.click();
  await page.getByLabel(t.street, { exact: true }).fill(street);
  await page.getByLabel(t.postcode, { exact: true }).fill(CUSTOMER.postcode);
  await page.getByLabel(t.city, { exact: true }).fill(CUSTOMER.city);
  await page.getByLabel(t.phone, { exact: true }).fill(CUSTOMER.phone);
};

// Paczkomat wybrany na otwartej mapie InPostu tak jak klient: wyszukanie
// kodu i „Wybierz". Mapa jest w ramce i mówi po polsku na polskiej stronie.
export const pickLockerOnMap = async (page: Page, code: string) => {
  const map = page.frameLocator("inpost-geowidget iframe");
  await map.locator("input").first().fill(code);
  await map.locator("li", { hasText: code }).first().click();
  await map.getByRole("button", { name: "Wybierz" }).first().click();
  await expect(page.getByText(code, { exact: true })).toBeVisible();
};

// Paczkomat w kasie, razem z obowiązkowym przy nim telefonem.
export const chooseLocker = async (page: Page, code: string) => {
  const t = MESSAGES.pl.checkout;
  await page.getByRole("button", { name: t.chooseLocker }).click();
  await pickLockerOnMap(page, code);
  await page.getByLabel(t.phoneRequired, { exact: true }).fill(CUSTOMER.phone);
};

// „Złóż zamówienie" (albo „Zapisz zmiany" przy poprawce) — zwraca numer
// zamówienia z kroku Płatność.
export const placeOrder = async (
  page: Page,
  locale: Locale,
  button: "placeOrder" | "saveChanges" = "placeOrder"
): Promise<number> => {
  const t = MESSAGES[locale].checkout;
  await page.getByRole("button", { name: t[button] }).click();
  const placed = page.getByText(new RegExp(t.orderPlaced.replace("{number}", "(\\d+)")));
  await expect(placed).toBeVisible({ timeout: 30_000 });
  const [, number] = (await placed.textContent())!.match(/(\d+)/)!;
  return Number(number);
};

// Czeka, aż element przestanie zmieniać położenie i wysokość.
const waitUntilStill = async (page: Page, element: Locator) => {
  await expect
    .poll(async () => {
      const before = JSON.stringify(await element.boundingBox());
      await page.waitForTimeout(300);
      return before === JSON.stringify(await element.boundingBox());
    })
    .toBe(true);
};

// Formularz płatności Stripe'a siedzi w ramce w naszym formularzu kroku
// Płatność (nazwy i tytuły ramek Stripe zmienia — miejsce zostaje). Metody
// są na liście do rozwinięcia; karta nie jest pierwsza (BLIK), więc trzeba
// ją wybrać.
export const payByCard = async (page: Page, locale: Locale, card: string) => {
  const payLabel = MESSAGES[locale].checkout.payButton.split(" {")[0];
  const payButton = page.getByRole("button", { name: new RegExp(`^${payLabel} `) });
  const frame = page.locator("form", { has: payButton }).locator("iframe").first();
  const stripe = frame.contentFrame();

  await stripe.locator('[role="button"][data-value="card"]').click({ timeout: 30_000 });
  await stripe.locator('input[name="number"]').fill(card);
  await stripe.locator('input[name="expiry"]').fill("12 / 34");
  await stripe.locator('input[name="cvc"]').fill("123");
  const postalCode = stripe.locator('input[name="postalCode"]');
  if (await postalCode.isVisible()) await postalCode.fill(CUSTOMER.postcode);

  // Po wpisaniu karty Stripe rozwija pod nią „Zapisz moje dane" (Link),
  // a przewinięcie do „Zapłać" zmniejsza nagłówek sklepu — w obu wypadkach
  // przycisk jedzie, a kliknięcie w trakcie trafiało w próżnię.
  await waitUntilStill(page, frame);
  await payButton.scrollIntoViewIfNeeded();
  await waitUntilStill(page, payButton);
  await payButton.click();
};
