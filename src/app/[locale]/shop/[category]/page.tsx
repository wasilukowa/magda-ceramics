import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { productService } from "@/lib/service/product";
import ProductCard from "@/components/ProductCard";
import EmptyCategory from "@/components/EmptyCategory";
import { EmptyCategoryReason } from "@/contracts/shared";
import { getCategoryLabel } from "@/lib/helpers/category";
import { cn } from "@/lib/utils";

// The slug comes straight from the URL — keep what we echo back on screen short.
const MAX_LABEL_LENGTH = 40;

const getSlugLabel = (slug: string) =>
  slug.length > MAX_LABEL_LENGTH ? `${slug.slice(0, MAX_LABEL_LENGTH)}…` : slug;

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

  if (!cat) {
    const t = await getTranslations("shop.empty");
    return {
      title: `${t("unknownTitle")} — Magda Ceramics`,
      // Nothing to index here — keep bogus slugs out of search results.
      robots: { index: false, follow: true },
    };
  }

  const t = await getTranslations();
  return { title: `${getCategoryLabel(t, cat)} — Magda Ceramics` };
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
  // Never call getProducts() without an id here — without a category filter the
  // service returns the whole catalogue, which used to make unknown slugs look
  // like a full shop page.
  const products = cat ? await productService.getProducts(cat.id) : [];

  if (!cat || products.length === 0) {
    return (
      <EmptyCategory
        reason={cat ? EmptyCategoryReason.NoProducts : EmptyCategoryReason.Unknown}
        categoryLabel={cat ? getCategoryLabel(t, cat) : getSlugLabel(category)}
        categories={await productService.getCategoryTiles(category)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {getCategoryLabel(t, cat)}
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
            {getCategoryLabel(t, c)}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
