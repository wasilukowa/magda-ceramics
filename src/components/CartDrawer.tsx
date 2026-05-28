"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/hooks/useCart";

export default function CartDrawer() {
  const { items, removeItem, total, isOpen, closeCart } = useCart();
  const t = useTranslations("cart");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-50"
        onClick={closeCart}
        aria-hidden
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-[var(--background)] z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <span className="text-xs tracking-widest uppercase">{t("title")}</span>
          <button
            onClick={closeCart}
            aria-label={t("close")}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center mt-12">
              {t("empty")}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <Link href={{ pathname: "/product/[slug]", params: { slug: item.slug } }} onClick={closeCart}>
                  <div className="w-20 h-20 bg-[var(--color-ceramic)] flex-shrink-0 overflow-hidden">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={{ pathname: "/product/[slug]", params: { slug: item.slug } }}
                    onClick={closeCart}
                    className="text-xs tracking-widest uppercase leading-tight hover:text-[var(--muted)] transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-[var(--muted)] mt-1">{item.price} zł</p>

                  <div className="flex items-center mt-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xs tracking-widest uppercase"
                      aria-label="Remove item"
                    >
                      {t("remove")}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-6 border-t border-[var(--border)] space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-xs tracking-widest uppercase text-[var(--muted)]">{t("total")}</span>
              <span className="tracking-wide">{total.toFixed(2)} zł</span>
            </div>
            <p className="text-xs text-[var(--muted)]">{t("shipping")}</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 text-center hover:opacity-80 transition-opacity"
            >
              {t("checkout")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
