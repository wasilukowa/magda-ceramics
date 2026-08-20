"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/hooks/useCurrency";
import { Currency, SwitcherProps } from "@/contracts/shared";
import { cn } from "@/lib/utils";

// Both currencies are always on screen with the active one marked, instead of a
// single button showing the currency the customer is *not* using — next to a
// price like "18 €" a lone "PLN" reads as a label, not as a switch.
const OPTIONS = [
  { value: Currency.PLN, label: "PLN" },
  { value: Currency.EUR, label: "EUR" },
];

export default function CurrencySwitcher({ className }: SwitcherProps) {
  const t = useTranslations("nav");
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      role="group"
      aria-label={t("currency")}
      className={cn(
        "flex items-center gap-1.5 text-xs tracking-widest uppercase",
        className
      )}
    >
      {OPTIONS.map((option, index) => (
        <Fragment key={option.value}>
          {index > 0 && (
            <span aria-hidden="true" className="text-[var(--muted)] opacity-40">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => setCurrency(option.value)}
            aria-pressed={currency === option.value}
            className={cn(
              "transition-opacity",
              currency === option.value
                ? "text-[var(--foreground)] underline underline-offset-4"
                : "text-[var(--muted)] opacity-70 hover:opacity-100"
            )}
          >
            {option.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
