"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { AddToCartButtonProps, ButtonSize } from "@/contracts/shared";
import { ButtonArrow, buttonClass } from "@/components/ui/button";

export default function AddToCartButton({
  id, slug, name, price, image, inStock, hasPrice, reserved = false,
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
        className="w-full border border-[var(--color-control-border)] text-xs tracking-widest uppercase py-4 text-[var(--muted)] cursor-not-allowed"
      >
        {t("unavailable")}
      </button>
    );
  }

  if (!inStock) {
    return (
      <button
        disabled
        className="w-full border border-[var(--color-control-border)] text-xs tracking-widest uppercase py-4 text-[var(--muted)] cursor-not-allowed"
      >
        {reserved ? t("reserved") : t("outOfStock")}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={buttonClass({ size: ButtonSize.Block })}
    >
      {alreadyInCart ? t("inCart") : added ? t("added") : t("add")}
      <ButtonArrow />
    </button>
  );
}
