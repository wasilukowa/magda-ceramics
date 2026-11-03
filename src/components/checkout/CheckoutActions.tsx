"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ButtonSize, ButtonVariant } from "@/contracts/shared";
import { ButtonArrow, buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onBack: () => void;
  primaryLabel: ReactNode;
  // „Złóż zamówienie" i „Zapłać" są turkusowe — po nich coś dzieje się
  // naprawdę (decyzja Natalii 2026-10-12). „Dalej" zostaje czarne.
  accent?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  // Zdanie pod przyciskami, np. co się stanie po złożeniu zamówienia.
  hint?: string;
  // Główny przycisk szerszy, a „Wstecz" węższe — dla dłuższego napisu
  // „Zamawiam z obowiązkiem zapłaty" (decyzja Natalii 2026-11-03).
  wide?: boolean;
};

// Przyciski pod kolumną z krokami kasy: „Wstecz" i główna akcja kroku. Główna
// to zwykły submit, więc Enter w polu formularza też przechodzi dalej.
export default function CheckoutActions({
  onBack,
  primaryLabel,
  accent = false,
  disabled = false,
  loading = false,
  error,
  hint,
  wide = false,
}: Props) {
  const t = useTranslations("checkout");

  return (
    <div className="mt-10 space-y-4">
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
      <div className={cn("grid gap-4", wide ? "grid-cols-[auto_1fr]" : "grid-cols-2")}>
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className={buttonClass({
            variant: ButtonVariant.Secondary,
            size: ButtonSize.Block,
            className: cn(wide && "px-6"),
          })}
        >
          {t("back")}
        </button>
        <button
          type="submit"
          disabled={disabled || loading}
          className={buttonClass({
            variant: accent ? ButtonVariant.Accent : ButtonVariant.Primary,
            size: ButtonSize.Block,
          })}
        >
          {loading ? t("processing") : primaryLabel}
          {!loading && <ButtonArrow />}
        </button>
      </div>
      {hint && <p className="text-xs text-[var(--muted)] text-center leading-relaxed">{hint}</p>}
    </div>
  );
}
