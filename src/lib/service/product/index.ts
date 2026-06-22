import { serverFetch } from "@/lib/api";
import { RawProduct, RawCategory, ProductProps, CategoryProps } from "@/contracts/server/product";
import { prepareProduct, prepareCategory } from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

class ProductService {
  private static instance: ProductService;
  private readonly authHeader: string;

  private constructor() {
    this.authHeader = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  }

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  private async wcFetch<T>(endpoint: string): Promise<T> {
    const res = await serverFetch(`${WP_URL}/wp-json/wc/v3/${endpoint}`, {
      headers: { Authorization: `Basic ${this.authHeader}` },
      next: { revalidate: 60 },
    } as RequestInit);
    if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getCategories(): Promise<CategoryProps[]> {
    const raw = await this.wcFetch<RawCategory[]>(
      "products/categories?per_page=20&hide_empty=false"
    );
    return raw
      .filter((c) => c.slug !== "uncategorized")
      .map(prepareCategory);
  }

  async getProducts(categoryId?: number): Promise<ProductProps[]> {
    const query = categoryId ? `category=${categoryId}&` : "";
    const raw = await this.wcFetch<RawProduct[]>(`products?${query}per_page=20`);
    return raw
      .filter((p) => p.price && parseFloat(p.price) > 0)
      .map(prepareProduct);
  }

  async getProductBySlug(slug: string): Promise<ProductProps | null> {
    const results = await this.wcFetch<RawProduct[]>(`products?slug=${slug}`);
    return results[0] ? prepareProduct(results[0]) : null;
  }

  async getProductsByIds(ids: number[]): Promise<ProductProps[]> {
    if (ids.length === 0) return [];
    const raw = await this.wcFetch<RawProduct[]>(
      `products?include=${ids.join(",")}&per_page=${ids.length}`
    );
    return raw.map(prepareProduct);
  }
}

export const productService = ProductService.getInstance();
