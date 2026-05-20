"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useEffect } from "react";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, total, isOpen, closeCart } = useCart();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-50"
        onClick={closeCart}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-[var(--background)] z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <span className="text-xs tracking-widest uppercase">Koszyk</span>
          <button
            onClick={closeCart}
            aria-label="Zamknij koszyk"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center mt-12">
              Koszyk jest pusty
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <Link href={`/produkt/${item.slug}`} onClick={closeCart}>
                  <div className="w-20 h-20 bg-[#e8e0d5] flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/produkt/${item.slug}`}
                    onClick={closeCart}
                    className="text-xs tracking-widest uppercase leading-tight hover:text-[var(--muted)] transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-[var(--muted)] mt-1">{item.price} zł</p>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
                      aria-label="Zmniejsz ilość"
                    >
                      −
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
                      aria-label="Zwiększ ilość"
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      aria-label="Usuń produkt"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-[var(--border)] space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-xs tracking-widest uppercase text-[var(--muted)]">Suma</span>
              <span className="tracking-wide">{total.toFixed(2)} zł</span>
            </div>
            <p className="text-xs text-[var(--muted)]">Koszt wysyłki zostanie obliczony przy kasie</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 text-center hover:opacity-80 transition-opacity"
            >
              Przejdź do kasy
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
