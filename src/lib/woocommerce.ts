const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

async function wcFetch(endpoint: string) {
  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  const res = await fetch(`${WP_URL}/wp-json/wc/v3/${endpoint}`, {
    headers: { Authorization: `Basic ${auth}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
  return res.json();
}

export type WCCategory = {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: { src: string; alt: string } | null;
};

export type WCProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  description: string;
  short_description: string;
  images: { src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
  stock_status: string;
};

export async function getCategories(): Promise<WCCategory[]> {
  const cats: WCCategory[] = await wcFetch("products/categories?per_page=20&hide_empty=false");
  return cats.filter((c) => c.slug !== "uncategorized");
}

export async function getProducts(categoryId?: number): Promise<WCProduct[]> {
  const query = categoryId ? `category=${categoryId}&` : "";
  return wcFetch(`products?${query}per_page=20`);
}

export async function getProduct(slug: string): Promise<WCProduct | null> {
  const results: WCProduct[] = await wcFetch(`products?slug=${slug}`);
  return results[0] ?? null;
}
