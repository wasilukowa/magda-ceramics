import { cacheLife, cacheTag } from "next/cache";
import { serverFetch } from "@/lib/api";
import {
  RawProduct,
  RawCategory,
  ProductProps,
  CategoryProps,
  CategoryTileProps,
} from "@/contracts/server/product";
import { prepareProduct, prepareCategory, UNCATEGORIZED_SLUG } from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

// Etykieta całego katalogu. Dziś nikt jej nie unieważnia ręcznie — jest po to,
// żeby webhook z WooCommerce mógł kiedyś zrobić `revalidateTag(CATALOG_TAG)`
// i pokazać nową cenę od razu, zamiast czekać na upływ minuty.
export const CATALOG_TAG = "woocommerce-catalog";

const authHeader = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

// Jedyne miejsce, które rozmawia z WooCommerce — i jedyne, które trzeba było
// oznaczyć „use cache". Odpowiedź (czysty JSON) trafia do cache'u Next.js, więc
// katalog wchodzi do statycznej skorupy strony zamiast być liczony przy każdym
// żądaniu. `minutes` to dokładnie dawne `revalidate: 60`.
// UWAGA: to musi zostać zwykłą funkcją modułu, nie metodą klasy — „use cache"
// wciąga zmienne z domknięcia do klucza cache'u, a `this` (instancja klasy)
// nie jest serializowalne.
async function wcFetch<T>(endpoint: string): Promise<T> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const res = await serverFetch(`${WP_URL}/wp-json/wc/v3/${endpoint}`, {
    headers: { Authorization: `Basic ${authHeader}` },
  });
  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
  return res.json() as Promise<T>;
}

class ProductService {
  private static instance: ProductService;

  private constructor() {}

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async getCategories(): Promise<CategoryProps[]> {
    const raw = await wcFetch<RawCategory[]>(
      "products/categories?per_page=20&hide_empty=false"
    );
    return raw
      .filter((c) => c.slug !== UNCATEGORIZED_SLUG)
      .map(prepareCategory);
  }

  // Categories for the site navigation (menu, footer, homepage tiles): only the
  // ones that actually hold products. A WooCommerce outage must not take the
  // whole layout down with it, so a failed call degrades to an empty menu.
  async getNavigationCategories(): Promise<CategoryProps[]> {
    try {
      const categories = await this.getCategories();
      return categories.filter((category) => category.count > 0);
    } catch {
      return [];
    }
  }

  // Produkty bez ceny nie trafiają na stronę — cena jest jedyną rzeczą, bez
  // której karta produktu nie ma sensu, a Magda dodaje ją czasem później.
  private async fetchPreparedProducts(query: string): Promise<ProductProps[]> {
    const raw = await wcFetch<RawProduct[]>(`products?${query}`);
    return raw
      .filter((p) => p.price && parseFloat(p.price) > 0)
      .map(prepareProduct);
  }

  async getProducts(categoryId?: number): Promise<ProductProps[]> {
    const query = categoryId ? `category=${categoryId}&` : "";
    return this.fetchPreparedProducts(`${query}per_page=20`);
  }

  // Prace pokazywane na stronie głównej. Wybór należy do Magdy: w WooCommerce
  // wystarczy zaznaczyć przy produkcie gwiazdkę „Polecany". Dopóki nie zaznaczy
  // ich tylu, ile mieści sekcja, resztę dopełniają najnowsze produkty — inaczej
  // jedna gwiazdka dałaby na stronie głównej samotny kafelek. Zapasowe zapytanie
  // jest tym samym, które wysyła sklep, więc Next liczy je raz. Awaria
  // WooCommerce kończy się pustą sekcją, nie błędem całej strony głównej.
  async getFeaturedProducts(limit = 4): Promise<ProductProps[]> {
    try {
      const [featured, newest] = await Promise.all([
        this.fetchPreparedProducts(`featured=true&per_page=${limit}`),
        this.getProducts(),
      ]);

      const chosen = featured.slice(0, limit);
      for (const product of newest) {
        if (chosen.length >= limit) break;
        if (!chosen.some((c) => c.id === product.id)) chosen.push(product);
      }
      return chosen;
    } catch {
      return [];
    }
  }

  // Categories worth suggesting when a page has nothing to show: the ones that
  // actually hold products, minus the one the customer is already on. Each gets
  // a thumbnail — the category picture, or the first product photo as fallback.
  async getCategoryTiles(excludeSlug?: string): Promise<CategoryTileProps[]> {
    const categories = await this.getCategories();
    const candidates = categories.filter(
      (category) => category.count > 0 && category.slug !== excludeSlug
    );

    return Promise.all(
      candidates.map(async (category) => {
        if (category.image) return category;

        const [product] = await wcFetch<RawProduct[]>(
          `products?category=${category.id}&per_page=1`
        );
        return { ...category, image: product ? prepareProduct(product).images[0] ?? null : null };
      })
    );
  }

  async getProductBySlug(slug: string): Promise<ProductProps | null> {
    const results = await wcFetch<RawProduct[]>(`products?slug=${slug}`);
    return results[0] ? prepareProduct(results[0]) : null;
  }

  async getProductsByIds(ids: number[]): Promise<ProductProps[]> {
    if (ids.length === 0) return [];
    const raw = await wcFetch<RawProduct[]>(
      `products?include=${ids.join(",")}&per_page=${ids.length}`
    );
    return raw.map(prepareProduct);
  }
}

export const productService = ProductService.getInstance();
