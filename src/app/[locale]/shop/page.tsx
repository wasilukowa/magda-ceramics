import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { productService } from "@/lib/service/product";
import ProductCard from "@/components/ProductCard";
import { getCategoryLabel } from "@/lib/helpers/category";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return { title: `${t("title")} — Magda Ceramics` };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const [products, categories] = await Promise.all([
    productService.getProducts(),
    productService.getCategories(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("shop.title")}
      </h1>

      <div className="flex flex-wrap gap-3 justify-center mb-12">
        <Link
          href="/shop"
          className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-5 py-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          {t("categories.all")}
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={{ pathname: "/shop/[category]", params: { category: cat.slug } }}
            className="text-xs tracking-widest uppercase border border-[var(--border)] px-5 py-2 hover:border-[var(--foreground)] transition-colors"
          >
            {getCategoryLabel(t, cat)}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-center text-[var(--muted)]">{t("shop.noProducts")}</p>
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
