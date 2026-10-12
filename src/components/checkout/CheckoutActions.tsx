"use client";

import { useTranslations } from "next-intl";
import { ButtonSize, ButtonVariant } from "@/contracts/shared";
import { ButtonArrow, buttonClass } from "@/components/ui/button";

type Props = {
  onBack: () => void;
  primaryLabel: string;
  // „Złóż zamówienie" i „Zapłać" są turkusowe — po nich coś dzieje się
  // naprawdę (decyzja Natalii 2026-10-12). „Dalej" zostaje czarne.
  accent?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  // Zdanie pod przyciskami, np. co się stanie po złożeniu zamówienia.
  hint?: string;
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
}: Props) {
  const t = useTranslations("checkout");

  return (
    <div className="mt-10 space-y-4">
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className={buttonClass({ variant: ButtonVariant.Secondary, size: ButtonSize.Block })}
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
