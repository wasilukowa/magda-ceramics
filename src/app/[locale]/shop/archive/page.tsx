import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { productService } from "@/lib/service/product";
import { sortProducts } from "@/lib/helpers/product";
import { ProductSort } from "@/contracts/server/product";
import ProductCard, { EAGER_CARDS } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductsLoading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "archive" });
  return buildPageMetadata({
    locale,
    route: "/shop/archive",
    title: t("title"),
    description: t("metaDescription"),
  });
}

// Prace, które znalazły właściciela. To nie jest sprzedaż, tylko dorobek —
// każda ceramika jest tu jedna, więc archiwum pokazuje, ile ich już było.
async function ArchiveGrid({ locale }: { locale: string }) {
  const [t, products] = await Promise.all([
    getTranslations({ locale, namespace: "archive" }),
    productService.getArchivedProducts(),
  ]);

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-[var(--muted)]">
        {t("empty")}
      </p>
    );
  }

  const sorted = sortProducts(products, ProductSort.Newest, locale);

  return (
    <>
      <p className="mb-10 text-center text-xs uppercase tracking-widest text-[var(--muted)]">
        {t("count", { count: sorted.length })}
      </p>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {sorted.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            soldOutLabel={t("sold")}
            eager={index < EAGER_CARDS}
          />
        ))}
      </div>
    </>
  );
}

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "archive" });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-12 text-center text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
        {t("title")}
      </h1>

      {/* Siatka czeka na WooCommerce, więc idzie za granicą <Suspense> —
          nagłówek i wstęp zostają w statycznej skorupie strony. */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ArchiveGrid locale={locale} />
      </Suspense>
    </div>
  );
}
