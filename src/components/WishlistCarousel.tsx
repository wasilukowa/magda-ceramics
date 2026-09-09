"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/hooks/useWishlist";
import { getWishlistProducts } from "@/server-actions/wishlist";
import { ProductProps } from "@/contracts/server/product";
import ProductCard from "@/components/ProductCard";
import ProductCarousel, {
  CAROUSEL_ITEM_CLASS,
} from "@/components/ProductCarousel";

// Ulubione klienta na stronie głównej, pod cytatem. Sekcja istnieje tylko
// wtedy, gdy jest co pokazać: pusta lista, niewczytane jeszcze dane albo
// milcząca odpowiedź WooCommerce znaczą, że NIE MA JEJ WCALE — żadnego
// nagłówka nad pustką, żadnego migania przy wejściu na stronę.
//
// Lista ulubionych mieszka w przeglądarce (u gościa) albo na koncie, więc tej
// sekcji nie da się policzyć na serwerze — i dobrze, bo dzięki temu strona
// główna zostaje statyczna, a ta jedna sekcja dochodzi później.
export default function WishlistCarousel() {
  const { ids } = useWishlist();
  const t = useTranslations("home");
  const [products, setProducts] = useState<ProductProps[]>([]);

  useEffect(() => {
    // Pusta lista nie wymaga ani zapytania, ani czyszczenia stanu: `visible`
    // niżej i tak przepuszcza tylko to, co nadal jest w `ids`. (setState w ciele
    // efektu to kaskada renderów — ta sama reguła, która wyszła przy K1.)
    if (ids.length === 0) return;

    let active = true;
    getWishlistProducts(ids).then((items) => {
      if (!active) return;
      // `null` znaczy „nie udało się zapytać" — wtedy po prostu nic nie
      // pokazujemy, zamiast straszyć błędem na stronie głównej.
      setProducts(items ?? []);
    });

    return () => {
      active = false;
    };
  }, [ids]);

  // Pokazujemy tylko to, co nadal jest na liście — usunięcie serca w innym
  // miejscu strony ma znikać stąd od razu, bez czekania na ponowne pobranie.
  const visible = products.filter((product) => ids.includes(product.id));

  if (visible.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20">
      <h2 className="mb-12 text-center text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
        {t("wishlist")}
      </h2>

      <ProductCarousel label={t("wishlist")}>
        {visible.map((product) => (
          <div key={product.id} className={CAROUSEL_ITEM_CLASS}>
            <ProductCard product={product} soldOutLabel={t("wishlistSold")} />
          </div>
        ))}
      </ProductCarousel>

      <div className="mt-12 flex justify-center">
        <Link
          href="/wishlist"
          className="inline-block border border-current px-7 py-3 text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
        >
          {t("wishlistLink")}
        </Link>
      </div>
    </section>
  );
}
