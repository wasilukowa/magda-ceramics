import { getProducts, getCategories } from "@/lib/woocommerce";
import ProductCard from "@/components/ProductCard";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((cat) => ({ kategoria: cat.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ kategoria: string }> }) {
  const { kategoria } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === kategoria);
  return { title: `${cat?.name ?? kategoria} — Magda Ceramics` };
}

export default async function CategoryPage({ params }: { params: Promise<{ kategoria: string }> }) {
  const { kategoria } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === kategoria);
  const products = await getProducts(category?.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {category?.name ?? kategoria}
      </h1>

      {/* Filtry kategorii */}
      <div className="flex flex-wrap gap-3 justify-center mb-12">
        <a
          href="/sklep"
          className="text-xs tracking-widest uppercase border border-[var(--border)] px-5 py-2 hover:border-[var(--foreground)] transition-colors"
        >
          Wszystkie
        </a>
        {categories.map((cat) => (
          <a
            key={cat.slug}
            href={`/sklep/${cat.slug}`}
            className={`text-xs tracking-widest uppercase border px-5 py-2 transition-colors ${
              cat.slug === kategoria
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)] hover:border-[var(--foreground)]"
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-center text-[var(--muted)]">Brak produktów w tej kategorii.</p>
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
