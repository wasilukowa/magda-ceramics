"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import CategoryTile from "@/components/CategoryTile";
import {
  ButtonVariant,
  EmptyCategoryProps,
  EmptyCategoryReason,
} from "@/contracts/shared";
import { getCategoryLabel } from "@/lib/helpers/category";
import { ButtonArrow, buttonClass } from "@/components/ui/button";

// How long the customer gets to read the message and pick a tile before the
// full catalogue takes over.
const REDIRECT_SECONDS = 8;

// Siatka 2 / 3 / 4 kolumny w kontenerze max-w-4xl z px-6 i odstępem 24 px.
// Zaokrąglone w górę, żeby przeglądarka nie wzięła pliku mniejszego niż kafelek.
const TILE_SIZES =
  "(min-width: 1024px) 200px, (min-width: 768px) calc(33.33vw - 32px), calc(50vw - 36px)";

export default function EmptyCategory({
  reason,
  categoryLabel,
  categories,
}: EmptyCategoryProps) {
  const t = useTranslations("shop.empty");
  const tRoot = useTranslations();
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
            className={buttonClass()}
          >
            {t("goNow")}
            <ButtonArrow />
          </Link>
          {!stopped && (
            <button
              type="button"
              onClick={() => setStopped(true)}
              className={buttonClass({ variant: ButtonVariant.Secondary })}
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
              <CategoryTile
                key={category.slug}
                category={category}
                label={getCategoryLabel(tRoot, category)}
                detail={t("items", { count: category.count })}
                sizes={TILE_SIZES}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
