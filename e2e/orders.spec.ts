import { type Page } from "@playwright/test";
import { RawOrder } from "@/contracts/server/order";
import { Currency } from "@/contracts/shared";
import { convertPlnToEur } from "@/lib/helpers/currency";
import { getShippingCost } from "@/lib/helpers/shipping";
import { ORDER_META } from "@/lib/service/order/helpers";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { expect, newCustomer, test } from "./fixtures";
import {
  CARD_DECLINED,
  CARD_OK,
  MESSAGES,
  TEST_EMAIL,
  addToCart,
  chooseLocker,
  fillContact,
  fillCourierAddress,
  payByCard,
  placeOrder,
  startGuestCheckout,
  type Locale,
} from "./support/checkout";
import {
  discardOrder,
  getAvailableProducts,
  getProduct,
  getTestOrders,
  restoreStock,
} from "./support/woocommerce";

// PRAWDZIWE zamówienia w WooCommerce Magdy, opłacane testowym Stripe'em.
// Uruchamiane tylko świadomie: `npm run test:e2e:orders`. Każde zamówienie
// po teście jest anulowane (praca wraca do sklepu) i trafia do kosza.
// Maile idą na skrzynkę testową — oprócz angielskiego „Order cancelled",
// który WooCommerce przy anulowaniu wysyła do administratora sklepu.
test.skip(!process.env.E2E_ORDERS, "zamówienia tylko przez npm run test:e2e:orders");
test.describe.configure({ mode: "serial", timeout: 180_000 });

type Product = Awaited<ReturnType<typeof getAvailableProducts>>[number];

// Minuta zapasu na różnicę zegarów z serwerem WordPressa.
const startedAt = new Date(Date.now() - 60_000);
let products: Product[] = [];

test.beforeAll(async () => {
  products = await getAvailableProducts(4);
});

test.afterAll(async () => {
  for (const order of await getTestOrders(startedAt, TEST_EMAIL)) {
    await discardOrder(order.id);
  }
  // Po anulowaniu każda praca ma znów jedną sztukę w sklepie.
  const missing: string[] = [];
  for (const product of products) {
    const now = await getProduct(product.id);
    if (now.stock_quantity !== 1 || now.stock_status !== "instock") {
      missing.push(product.name);
      await restoreStock(product.id);
    }
  }
  expect(missing, "prace, które nie wróciły do sklepu po anulowaniu").toEqual([]);
});

const findOrder = async (number: number): Promise<RawOrder> => {
  const order = (await getTestOrders(startedAt, TEST_EMAIL)).find(
    (candidate) => candidate.number === String(number)
  );
  if (!order) throw new Error(`Nie ma w WooCommerce zamówienia #${number}`);
  return order;
};

const expectPaid = async (page: Page, locale: Locale, number: number) => {
  const thanks = MESSAGES[locale].success.orderReceived.replace("{orderId}", String(number));
  await expect(page.getByText(thanks.split(".")[0])).toBeVisible({ timeout: 60_000 });
  const order = await findOrder(number);
  expect(order.status).toBe("processing");
  expect(order.date_paid_gmt).toBeTruthy();
  return order;
};

test("a Polish customer pays by card for courier delivery", async ({ page }) => {
  const product = products[0];
  await addToCart(page, "pl", product.slug);
  await startGuestCheckout(page, "pl");
  await fillContact(page, "pl");
  await fillCourierAddress(page, "pl");
  const number = await placeOrder(page, "pl");

  // Złożone, jeszcze nieopłacone: praca zarezerwowana, nikt inny jej nie kupi.
  expect((await findOrder(number)).status).toBe("on-hold");
  expect((await getProduct(product.id)).stock_quantity).toBe(0);

  await payByCard(page, "pl", CARD_OK);
  const order = await expectPaid(page, "pl", number);
  expect(order.currency).toBe("PLN");
  expect(Number(order.total)).toBe(
    Number(product.price) + getShippingCost("PL", Currency.PLN, DeliveryMethod.Courier)
  );
  // Zapłata nie zdejmuje sztuki drugi raz.
  expect((await getProduct(product.id)).stock_quantity).toBe(0);
});

test("a declined card keeps the order, a corrected address stays in it", async ({ page }) => {
  const t = MESSAGES.pl.checkout;
  const product = products[1];
  await addToCart(page, "pl", product.slug);
  await startGuestCheckout(page, "pl");
  await fillContact(page, "pl");
  await chooseLocker(page, "WAW01M");
  const number = await placeOrder(page, "pl");

  await payByCard(page, "pl", CARD_DECLINED);
  await expect(page.getByText(/odrzucon|declined/i)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(t.orderPlaced.replace("{number}", String(number)))).toBeVisible();

  // Wstecz → kurier zamiast paczkomatu → „Zapisz zmiany": to samo zamówienie.
  await page.getByRole("button", { name: t.back }).click();
  await fillCourierAddress(page, "pl", "Poprawiona 2");
  expect(await placeOrder(page, "pl", "saveChanges")).toBe(number);
  expect((await findOrder(number)).shipping?.address_1).toBe("Poprawiona 2");

  await payByCard(page, "pl", CARD_OK);
  await expectPaid(page, "pl", number);
  const withThisWork = (await getTestOrders(startedAt, TEST_EMAIL)).filter((candidate) =>
    candidate.line_items.some((item) => item.product_id === product.id)
  );
  expect(withThisWork).toHaveLength(1);
});

test("a reserved work cannot be bought twice, and returns when cancelled", async ({
  page,
  browser,
  baseURL,
}) => {
  const t = MESSAGES.pl;
  const product = products[2];

  // Drugi klient ma tę samą pracę w koszyku, zanim pierwszy złoży zamówienie.
  const rival = await newCustomer(browser, baseURL!);
  await addToCart(rival, "pl", product.slug);

  await addToCart(page, "pl", product.slug);
  await startGuestCheckout(page, "pl");
  await fillContact(page, "pl");
  await fillCourierAddress(page, "pl");
  const number = await placeOrder(page, "pl");

  await startGuestCheckout(rival, "pl");
  await fillContact(rival, "pl");
  await fillCourierAddress(rival, "pl");
  await rival.getByRole("button", { name: t.checkout.placeOrder }).click();
  await expect(rival.getByText(t.checkout.soldOutTitle)).toBeVisible({ timeout: 30_000 });
  await expect(rival.getByRole("listitem").filter({ hasText: product.name })).toBeVisible();
  await rival.context().close();

  // Pierwszy klient się rozmyśla — anuluje na stronie zamówienia z maila.
  const order = await findOrder(number);
  await page.goto(`/pl/zamowienie?id=${order.id}&key=${order.order_key}`);
  await page.getByRole("button", { name: t.order.cancel.button }).click();
  await page.getByRole("button", { name: t.order.cancel.confirm }).click();
  await expect(page.getByText(t.order.cancelled)).toBeVisible({ timeout: 30_000 });

  expect((await findOrder(number)).status).toBe("cancelled");
  expect((await getProduct(product.id)).stock_quantity).toBe(1);
});

test("an English customer pays in euro for delivery to Germany", async ({ page }) => {
  const product = products[3];
  await addToCart(page, "en", product.slug);
  await startGuestCheckout(page, "en");
  await fillContact(page, "en");
  await page.getByLabel(MESSAGES.en.checkout.country).selectOption("DE");
  await fillCourierAddress(page, "en");
  const number = await placeOrder(page, "en");

  await payByCard(page, "en", CARD_OK);
  // WooCommerce prowadzi zamówienia w złotych — zapłatę w euro sklep
  // zapisuje obok, do ewidencji sprzedaży.
  const order = await expectPaid(page, "en", number);
  const meta = (key: string) => order.meta_data?.find((entry) => entry.key === key)?.value;
  expect(meta(ORDER_META.paidCurrency)).toBe("EUR");
  expect(Number(meta(ORDER_META.paidAmount))).toBe(
    convertPlnToEur(Number(product.price)) +
      getShippingCost("DE", Currency.EUR, DeliveryMethod.Courier)
  );
});
