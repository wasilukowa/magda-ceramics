"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/hooks/useWishlist";
import { getWishlistProducts } from "@/server-actions/wishlist";
import { ProductProps } from "@/contracts/server/product";
import ProductCard from "@/components/ProductCard";
import WishlistButton from "@/components/WishlistButton";

export default function WishlistGrid() {
  const t = useTranslations("wishlist");
  const { ids } = useWishlist();
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (ids.length === 0) {
      setProducts([]);
      setLoaded(true);
      return;
    }
    getWishlistProducts(ids).then((items) => {
      if (active) {
        setProducts(items);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [ids]);

  if (!loaded) {
    return (
      <p className="text-sm text-[var(--muted)] text-center py-10">
        {t("loading")}
      </p>
    );
  }

  // Zachowaj tylko produkty wciąż obecne na liście (po usunięciu).
  const visible = products.filter((p) => ids.includes(p.id));

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
      {visible.map((product) => (
        <div key={product.id} className="relative">
          <WishlistButton
            productId={product.id}
            className="absolute top-2 right-2 z-10 bg-[var(--background)]/80 rounded-full p-2 text-[var(--foreground)]"
          />
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
