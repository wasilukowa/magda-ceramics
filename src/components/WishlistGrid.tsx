"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/hooks/useWishlist";
import { getWishlistProducts } from "@/server-actions/wishlist";
import { ProductProps } from "@/contracts/server/product";
import ProductCard from "@/components/ProductCard";

export default function WishlistGrid() {
  const t = useTranslations("wishlist");
  const tProduct = useTranslations("product");
  const { ids } = useWishlist();
  // null = jeszcze nie pytaliśmy serwera. Pusta lista ulubionych nie wymaga
  // żadnego zapytania, więc stan „wczytane" wynika z danych, a nie z osobnego
  // setState wołanego przy zamontowaniu.
  const [products, setProducts] = useState<ProductProps[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) return;

    let active = true;
    getWishlistProducts(ids).then((items) => {
      if (active) setProducts(items);
    });
    return () => {
      active = false;
    };
  }, [ids]);

  const loaded = ids.length === 0 || products !== null;

  if (!loaded) {
    return (
      <p className="text-sm text-[var(--muted)] text-center py-10">
        {t("loading")}
      </p>
    );
  }

  // Zachowaj tylko produkty wciąż obecne na liście (po usunięciu).
  const visible = (products ?? []).filter((p) => ids.includes(p.id));

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-6">
        <p className="text-sm text-[var(--muted)]">{t("empty")}</p>
        <Link
          href="/shop"
          className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          {t("browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {/* Serce siedzi teraz w samej karcie (ProductCard), więc ta strona nie
          dokłada już własnego — jedno miejsce, jeden wygląd. */}
      {visible.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          soldOutLabel={tProduct("outOfStock")}
        />
      ))}
    </div>
  );
}
