import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { productService } from "@/lib/service/product";
import ProductCard from "@/components/ProductCard";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  const categories = await productService.getCategories();
  return categories.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = await productService.getCategories();
  const cat = categories.find((c) => c.slug === category);
  return { title: `${cat?.name ?? category} — Magda Ceramics` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const t = await getTranslations();
  const categories = await productService.getCategories();
  const cat = categories.find((c) => c.slug === category);
  const products = await productService.getProducts(cat?.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {cat?.name ?? category}
      </h1>

      <div className="flex flex-wrap gap-3 justify-center mb-12">
        <Link
          href="/shop"
          className="text-xs tracking-widest uppercase border border-[var(--border)] px-5 py-2 hover:border-[var(--foreground)] transition-colors"
        >
          {t("categories.all")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={{ pathname: "/shop/[category]", params: { category: c.slug } }}
            className={cn(
              "text-xs tracking-widest uppercase border px-5 py-2 transition-colors",
              c.slug === category
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)] hover:border-[var(--foreground)]"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-center text-[var(--muted)]">
          {t("shop.noCategoryProducts")}
        </p>
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
