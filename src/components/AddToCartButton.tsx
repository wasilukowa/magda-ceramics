"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { AddToCartButtonProps } from "@/contracts/shared";

export default function AddToCartButton({
  id, slug, name, price, image, inStock, hasPrice,
}: AddToCartButtonProps) {
  const { items, addItem, openCart } = useCart();
  const t = useTranslations("addToCart");
  const [added, setAdded] = useState(false);
  const alreadyInCart = items.some((i) => i.id === id);

  function handleClick() {
    if (alreadyInCart) { openCart(); return; }
    addItem({ id, slug, name, price, image });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!hasPrice) {
    return (
      <button
        disabled
        className="w-full border border-[var(--border)] text-xs tracking-widest uppercase py-4 text-[var(--muted)] cursor-not-allowed"
      >
        {t("unavailable")}
      </button>
    );
  }

  if (!inStock) {
    return (
      <button
        disabled
        className="w-full border border-[var(--border)] text-xs tracking-widest uppercase py-4 text-[var(--muted)] cursor-not-allowed"
      >
        {t("outOfStock")}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 hover:opacity-80 transition-opacity"
    >
      {alreadyInCart ? t("inCart") : added ? t("added") : t("add")}
    </button>
  );
}
