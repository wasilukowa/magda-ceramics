import { getProducts, getCategories } from "@/lib/woocommerce";
import ProductCard from "@/components/ProductCard";

export const metadata = { title: "Sklep — Magda Ceramics" };

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        Sklep
      </h1>

      {/* Filtry kategorii */}
      <div className="flex flex-wrap gap-3 justify-center mb-12">
        <a
          href="/sklep"
          className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-5 py-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          Wszystkie
        </a>
        {categories.map((cat) => (
          <a
            key={cat.slug}
            href={`/sklep/${cat.slug}`}
            className="text-xs tracking-widest uppercase border border-[var(--border)] px-5 py-2 hover:border-[var(--foreground)] transition-colors"
          >
            {cat.name}
          </a>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-center text-[var(--muted)]">Brak produktów.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
