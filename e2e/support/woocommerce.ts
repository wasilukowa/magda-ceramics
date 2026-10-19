import { RawOrder } from "@/contracts/server/order";
import { RawProduct } from "@/contracts/server/product";

// Bezpośredni dostęp testów do WooCommerce Magdy — żeby sprawdzić, co sklep
// naprawdę zapisał (stan zamówienia, magazyn), i posprzątać po zamówieniach
// testowych. Klucze z .env.local (wczytuje je playwright.config.ts).

type StockedProduct = RawProduct & {
  status: string;
  manage_stock: boolean;
};

const wc = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const auth = Buffer.from(
    `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
  ).toString("base64");
  const response = await fetch(`${process.env.NEXT_PUBLIC_WP_URL}/wp-json/wc/v3${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`WooCommerce ${init.method ?? "GET"} ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const getProduct = (id: number) => wc<StockedProduct>(`/products/${id}`);

export const getOrder = (id: number) => wc<RawOrder>(`/orders/${id}`);

// Prace, które można kupić: z ceną, w sklepie, po jednej sztuce na stanie.
// Najtańsze najpierw — zamówienia testowe i tak zostaną anulowane, ale
// w razie wpadki mniej boli.
export const getAvailableProducts = async (count: number): Promise<StockedProduct[]> => {
  const products = await wc<StockedProduct[]>(
    "/products?status=publish&stock_status=instock&per_page=100&orderby=price&order=asc"
  );
  const available = products.filter(
    (product) =>
      Number(product.price) > 0 && product.manage_stock && product.stock_quantity === 1
  );
  if (available.length < count) {
    throw new Error(`Potrzeba ${count} dostępnych prac, w sklepie jest ${available.length}`);
  }
  return available.slice(0, count);
};

// Zamówienia testowe złożone od podanej chwili — po adresie skrzynki
// testowej, więc także te, których numeru test nie zdążył zapisać.
export const getTestOrders = async (since: Date, email: string): Promise<RawOrder[]> => {
  const orders = await wc<RawOrder[]>(
    `/orders?after=${since.toISOString()}&dates_are_gmt=true&per_page=50&search=${encodeURIComponent(email)}`
  );
  return orders.filter((order) => order.billing?.email === email);
};

// Sprzątanie po zamówieniu testowym: anulowanie (WooCommerce oddaje wtedy
// sztukę do sklepu) i kosz, żeby nie zostało na liście zamówień Magdy ani
// w zestawieniu sprzedaży.
export const discardOrder = async (id: number): Promise<void> => {
  const order = await getOrder(id);
  if (order.status !== "cancelled") {
    await wc(`/orders/${id}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
  }
  await wc(`/orders/${id}`, { method: "DELETE" });
};

// Gdyby sztuka po anulowaniu nie wróciła, test i tak to zgłosi — a sklep nie
// może zostać z pracą, której nie da się kupić.
export const restoreStock = async (id: number): Promise<void> => {
  await wc(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify({ stock_quantity: 1, stock_status: "instock" }),
  });
};
