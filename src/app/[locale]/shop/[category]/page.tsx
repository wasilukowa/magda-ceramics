import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { productService } from "@/lib/service/product";
import EmptyCategory from "@/components/EmptyCategory";
import CategoryFilterLinks from "@/components/shop/CategoryFilterLinks";
import ProductListing from "@/components/shop/ProductListing";
import { ProductGridSkeleton } from "@/components/ProductsLoading";
import { EmptyCategoryReason } from "@/contracts/shared";
import { getCategoryLabel } from "@/lib/helpers/category";

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
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  const categories = await productService.getCategories();
  const cat = categories.find((c) => c.slug === category);

  if (!cat) {
    const t = await getTranslations({ locale, namespace: "shop.empty" });
    return {
      title: `${t("unknownTitle")} — Magda Ceramics`,
      // Nothing to index here — keep bogus slugs out of search results.
      robots: { index: false, follow: true },
    };
  }

  const t = await getTranslations({ locale });
  return { title: `${getCategoryLabel(t, cat)} — Magda Ceramics` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale, category } = await params;
  const t = await getTranslations({ locale });
  const categories = await productService.getCategories();
  const cat = categories.find((c) => c.slug === category);
  // Never call getProducts() without an id here — without a category filter the
  // service returns the whole catalogue, which used to make unknown slugs look
  // like a full shop page. Sprawdzamy CAŁĄ kategorię, przed filtrami z adresu:
  // pusty wynik filtrowania to co innego niż pusta kategoria.
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

      <CategoryFilterLinks
        locale={locale}
        categories={categories}
        activeSlug={category}
      />

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductListing
          locale={locale}
          categoryId={cat.id}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}
