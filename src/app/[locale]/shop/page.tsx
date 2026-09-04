import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { productService } from "@/lib/service/product";
import CategoryFilterLinks from "@/components/shop/CategoryFilterLinks";
import ProductListing from "@/components/shop/ProductListing";
import { ProductGridSkeleton } from "@/components/ProductsLoading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return buildPageMetadata({
    locale,
    route: "/shop",
    title: t("title"),
    descriptionKey: "pages.shop",
  });
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const [t, categories] = await Promise.all([
    getTranslations({ locale, namespace: "shop" }),
    productService.getCategories(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("title")}
      </h1>

      <CategoryFilterLinks locale={locale} categories={categories} />

      {/* Wszystko powyżej liczy się z góry przy budowaniu; siatka zależy od
          ?sort= i ?availability= w adresie, więc dochodzi osobno. */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductListing locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
