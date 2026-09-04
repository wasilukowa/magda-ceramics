import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { productService } from "@/lib/service/product";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";
import WishlistButton from "@/components/WishlistButton";
import Price from "@/components/Price";
import { getCategoryLabel } from "@/lib/helpers/category";
import NotFoundView from "@/components/NotFoundView";
import { buildPageMetadata, toMetaDescription } from "@/lib/helpers/metadata";

export async function generateStaticParams() {
  try {
    const products = await productService.getProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await productService.getProductBySlug(slug);
  // Nieistniejący produkt rysuje widok 404 zamiast wołać `notFound()` — powód
  // w `[locale]/[...rest]/page.tsx`. Skoro status zostaje 200, wyszukiwarkę
  // trzyma z dala `robots`.
  if (!product) {
    const t = await getTranslations({ locale, namespace: "notFound" });
    return { title: `${t("title")} — Magda Ceramics`, robots: { index: false } };
  }
  // Opis pod wynik wyszukiwania bierzemy WYŁĄCZNIE z „krótkiego opisu"
  // w WooCommerce — to jedyne pole pomyślane jako streszczenie, i jedyne, które
  // idzie tu jako HTML, stąd `toMetaDescription`.
  // ‼️ Długi opis ŚWIADOMIE pominięty: dziś Magda trzyma w nim wymiary
  // („Wymiary: pojemność 115 ml…"), więc w Google zrobiłby się z tego bełkot
  // powtórzony przy każdym kubku. Gdy któryś produkt dostanie krótki opis,
  // wskoczy tu sam. Reszta dostaje zdanie z szablonu — z nazwą, więc i tak
  // każdy kubek ma własne.
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  const summary = toMetaDescription(product.shortDescription);

  return buildPageMetadata({
    locale,
    route: { pathname: "/product/[slug]", params: { slug: product.slug } },
    title: product.name,
    description: summary || tMeta("product", { name: product.name }),
    // Pierwsze zdjęcie produktu — to ono ma się pokazać, gdy ktoś wrzuci link
    // do kubka na Instagram czy do komunikatora. Zdjęcia wrzucone bez tekstu
    // alternatywnego zapożyczają nazwę produktu.
    image: product.images[0] && {
      ...product.images[0],
      alt: product.images[0].alt || product.name,
    },
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [product, t, tRoot, format] = await Promise.all([
    productService.getProductBySlug(slug),
    getTranslations({ locale, namespace: "product" }),
    getTranslations({ locale }),
    getFormatter({ locale }),
  ]);

  if (!product) return <NotFoundView />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <Link
        href="/shop"
        className="text-xs tracking-widest uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-10 inline-block"
      >
        {t("backToShop")}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-6">
          <div>
            {product.categories.length > 0 && (
              <p className="text-xs tracking-widest uppercase text-[var(--muted)] mb-2">
                {product.categories
                  .map((category) => getCategoryLabel(tRoot, category))
                  .join(", ")}
              </p>
            )}
            <h1 className="text-2xl font-light tracking-wide">{product.name}</h1>
          </div>

          {product.hasPrice ? (
            <Price
              price={product.price}
              priceEur={product.priceEur}
              className="block text-xl tracking-wide"
            />
          ) : (
            <p className="text-sm text-[var(--muted)] tracking-wide">
              {t("priceUnavailable")}
            </p>
          )}

          {product.shortDescription && (
            <div
              className="text-sm text-[var(--muted)] leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          <div className="space-y-3">
            <p className="text-xs tracking-widest uppercase text-[var(--muted)]">
              {product.inStock ? t("inStock") : t("outOfStock")}
            </p>
            <AddToCartButton
              id={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              priceEur={product.priceEur}
              image={product.images[0]?.src ?? ""}
              inStock={product.inStock}
              hasPrice={product.hasPrice}
            />
            <WishlistButton
              productId={product.id}
              withLabel
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            />
          </div>

          {product.dimensions.length > 0 && (
            <div className="border-t border-[var(--border)] pt-6">
              <p className="text-xs tracking-widest uppercase text-[var(--muted)] mb-3">
                {t("dimensionsTitle")}
              </p>
              <dl className="text-sm text-[var(--muted)] space-y-1.5">
                {product.dimensions.map((dimension) => (
                  <div key={dimension.key} className="flex gap-2">
                    <dt>{t(`dimensions.${dimension.key}`)}:</dt>
                    <dd className="text-[var(--foreground)]">
                      {format.number(dimension.value)} {dimension.unit}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.description && (
            <div
              className="text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
