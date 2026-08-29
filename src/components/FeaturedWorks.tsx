import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/ProductCard";
import { ProductProps } from "@/contracts/server/product";

// Sekcja „Wybrane prace" na stronie głównej. Wybór produktów robi serwis
// (gwiazdka „Polecany" w WooCommerce), tutaj zostaje sam widok. Pusta lista
// znaczy, że nie ma czego pokazać albo WooCommerce nie odpowiedziało — wtedy
// sekcja znika, zamiast straszyć nagłówkiem nad pustką.
export async function FeaturedWorks({
  products,
  locale,
}: {
  products: ProductProps[];
  locale: string;
}) {
  if (products.length === 0) return null;

  const [t, tProduct] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "product" }),
  ]);

  return (
    <section className="max-w-[1200px] mx-auto px-6 pt-10 pb-16">
      <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
        {t("featured")}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            soldOutLabel={tProduct("outOfStock")}
          />
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <Link
          href="/shop"
          className="inline-block border border-current px-7 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
        >
          {t("featuredLink")}
        </Link>
      </div>
    </section>
  );
}
