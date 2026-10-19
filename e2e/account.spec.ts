import { randomUUID } from "node:crypto";
import { type Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { CUSTOMER, MESSAGES, addToCart, pickLockerOnMap } from "./support/checkout";
import {
  createCustomer,
  deleteCustomers,
  getAvailableProducts,
} from "./support/woocommerce";

// Konto klienta z zapisanymi adresami i paczkomatami (2026-10-19) — na
// tymczasowym koncie w WooCommerce, usuwanym po teście. Zamówień tu nie ma:
// kasa tylko sprawdza, co sama wpisała.
// Skrzynka testowa Resenda z etykietą — WooCommerce wysyła na nią mail
// powitalny nowego konta, a adres nie zderza się z zamówieniami testowymi.
const EMAIL = "delivered+konto@resend.dev";
const PASSWORD = `Test-${randomUUID()}`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await deleteCustomers(EMAIL);
  await createCustomer({
    email: EMAIL,
    password: PASSWORD,
    first_name: CUSTOMER.firstName,
    last_name: CUSTOMER.lastName,
  });
});

test.afterAll(async () => {
  await deleteCustomers(EMAIL);
});

const t = MESSAGES.pl;

const logIn = async (page: Page) => {
  await page.goto("/pl/logowanie");
  await page.getByLabel(t.auth.fields.email).fill(EMAIL);
  await page.getByLabel(t.auth.fields.password).fill(PASSWORD);
  await page.getByRole("button", { name: t.auth.login.submit }).click();
  await expect(page).toHaveURL(/\/pl\/konto\/zamowienia$/, { timeout: 30_000 });
};

const addressCard = (page: Page, street: string) =>
  page.getByRole("listitem").filter({ has: page.locator("address", { hasText: street }) });

test("the account starts at orders and the person icon turns turquoise", async ({ page }) => {
  await logIn(page);
  const nav = page.locator("aside nav");
  await expect(nav.getByRole("link")).toHaveText([
    t.account.nav.orders,
    t.account.nav.details,
    t.account.nav.addresses,
    t.account.nav.wishlist,
  ]);
  // Ten sam kolor co wypełnione serce ulubionych (--color-heart, jasny motyw).
  await expect(
    page.getByRole("link", { name: t.nav.account }).first().locator("svg")
  ).toHaveCSS("color", "rgb(87, 117, 111)");
});

test("addresses and parcel lockers are saved in the account", async ({ page }) => {
  const a = t.account.addresses;
  await logIn(page);
  await page.getByRole("link", { name: t.account.nav.addresses }).click();
  await expect(page.getByText(a.emptyAddresses)).toBeVisible();
  await expect(page.getByText(a.emptyLockers)).toBeVisible();

  // Nowy adres zaczyna się od imienia i nazwiska z profilu.
  await page.getByRole("button", { name: a.add }).click();
  await expect(page.getByLabel(t.account.fields.firstName)).toHaveValue(CUSTOMER.firstName);
  await page.getByLabel(t.account.fields.street, { exact: true }).fill("Testowa 1");
  await page.getByLabel(t.account.fields.postcode).fill(CUSTOMER.postcode);
  await page.getByLabel(t.account.fields.city).fill(CUSTOMER.city);
  await page.getByLabel(t.account.fields.phone).fill(CUSTOMER.phone);
  await page.getByRole("button", { name: t.account.save }).click();
  await expect(page.getByText(a.saved)).toBeVisible();
  await expect(addressCard(page, "Testowa 1")).toContainText(
    `${CUSTOMER.firstName} ${CUSTOMER.lastName}Testowa 1${CUSTOMER.postcode} ${CUSTOMER.city}`
  );

  // „Edytuj" otwiera pola dopiero na żądanie.
  await addressCard(page, "Testowa 1").getByRole("button", { name: a.edit }).click();
  await page.getByLabel(t.account.fields.street, { exact: true }).fill("Testowa 2");
  await page.getByRole("button", { name: t.account.save }).click();
  await expect(addressCard(page, "Testowa 2")).toBeVisible();
  await expect(page.locator("address", { hasText: "Testowa 1" })).toHaveCount(0);

  await page.getByRole("button", { name: a.addLocker }).click();
  await pickLockerOnMap(page, "WAW01M");
  await expect(page.getByRole("listitem").filter({ hasText: "WAW01M" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: "WAW01M" })).toBeVisible();
  await expect(addressCard(page, "Testowa 2")).toBeVisible();
});

test("checkout fills in the saved address and locker", async ({ page }) => {
  const c = t.checkout;
  const [product] = await getAvailableProducts(1);
  await logIn(page);
  await addToCart(page, "pl", product.slug);
  await page.goto("/pl/checkout");

  // Zalogowany od razu w danych kontaktowych — z imieniem z profilu.
  await expect(page.getByLabel(c.firstName, { exact: true })).toHaveValue(CUSTOMER.firstName);
  await expect(page.getByLabel(c.emailLabel, { exact: true })).toHaveValue(EMAIL);
  await page.getByRole("button", { name: c.continue }).click();

  // Paczkomat z konta jest już wybrany, telefon wpisany z adresu.
  const savedLocker = page.getByRole("button", { name: /WAW01M/ });
  await expect(savedLocker).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel(c.phoneRequired, { exact: true })).toHaveValue(CUSTOMER.phone);

  // Kurier: adres z konta w polach i zaznaczony na liście.
  await page.getByRole("button", { name: new RegExp(`^${c.methodCourier}`) }).click();
  await expect(page.getByLabel(c.street, { exact: true })).toHaveValue("Testowa 2");
  await expect(page.getByRole("button", { name: /Testowa 2/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // Nowy adres wpisany w kasie trafia do konta jednym kliknięciem.
  await page.getByLabel(c.street, { exact: true }).fill("Nowa 5");
  await page.getByRole("button", { name: c.addToMyAddresses }).click();
  await expect(page.getByText(c.savedInAccount)).toBeVisible();
  await expect(page.getByRole("button", { name: /Nowa 5/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.goto("/pl/konto/adresy");
  await expect(page.locator("address")).toHaveCount(2);
  await expect(page.locator("address").first()).toContainText("Nowa 5");
});
