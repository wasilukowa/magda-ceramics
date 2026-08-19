"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { EmptyCategoryProps, EmptyCategoryReason } from "@/contracts/shared";

// How long the customer gets to read the message and pick a tile before the
// full catalogue takes over.
const REDIRECT_SECONDS = 8;

export default function EmptyCategory({
  reason,
  categoryLabel,
  categories,
}: EmptyCategoryProps) {
  const t = useTranslations("shop.empty");
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (stopped) return;

    if (secondsLeft <= 0) {
      // replace, so the back button does not drop the customer right back here.
      router.replace("/shop");
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [stopped, secondsLeft, router]);

  const isUnknown = reason === EmptyCategoryReason.Unknown;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)]">
          {isUnknown ? t("unknownTitle") : t("noProductsTitle")}
        </h1>
        <p className="text-lg text-[var(--foreground)]">
          {isUnknown
            ? t("unknownLead", { category: categoryLabel })
            : t("noProductsLead", { category: categoryLabel })}
        </p>
        <p className="text-sm text-[var(--muted)]" aria-live="polite">
          {stopped ? t("stopped") : t("countdown", { seconds: secondsLeft })}
        </p>

        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            href="/shop"
            className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            {t("goNow")}
          </Link>
          {!stopped && (
            <button
              type="button"
              onClick={() => setStopped(true)}
              className="text-xs tracking-widest uppercase border border-[var(--border)] px-8 py-3 hover:border-[var(--foreground)] transition-colors"
            >
              {t("stay")}
            </button>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-8 text-center">
            {t("pick")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={{
                  pathname: "/shop/[category]",
                  params: { category: category.slug },
                }}
                className="group"
              >
                <div className="aspect-square bg-[var(--color-ceramic)] overflow-hidden mb-3">
                  {category.image ? (
                    <Image
                      src={category.image.src}
                      alt={category.image.alt || category.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                </div>
                <p className="text-xs tracking-widest uppercase text-[var(--foreground)]">
                  {category.name}
                </p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {t("items", { count: category.count })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
