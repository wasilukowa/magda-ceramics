"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

type Props = {
  id: number;
  slug: string;
  name: string;
  price: string;
  image: string;
  inStock: boolean;
  hasPrice: boolean;
};

export default function AddToCartButton({ id, slug, name, price, image, inStock, hasPrice }: Props) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
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
        Niedostępna cena
      </button>
    );
  }

  if (!inStock) {
    return (
      <button
        disabled
        className="w-full border border-[var(--border)] text-xs tracking-widest uppercase py-4 text-[var(--muted)] cursor-not-allowed"
      >
        Niedostępny
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 hover:opacity-80 transition-opacity"
    >
      {added ? "Dodano ✓" : "Dodaj do koszyka"}
    </button>
  );
}
