"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  // Ordered step labels shown next to each circle.
  steps: string[];
  // Zero-based index of the step the customer is currently on.
  current: number;
  // Najdalszy krok, na który wolno przejść kliknięciem — o tym decyduje kasa
  // (np. „Płatność" dopiero po złożeniu zamówienia). Domyślnie bieżący.
  reachable?: number;
  // Bez tego pasek jest tylko do oglądania (strona po zapłacie).
  onSelect?: (index: number) => void;
};

export default function CheckoutStepper({ steps, current, reachable = current, onSelect }: Props) {
  const t = useTranslations("checkout");

  return (
    <nav aria-label={t("progress")} className="mb-12">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const isActive = index === current;
          const isDone = index < current;
          const isReachable = !!onSelect && index <= reachable && !isActive;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className={cn("flex items-start", !isLast && "flex-1")}
            >
              <button
                type="button"
                disabled={!isReachable}
                aria-current={isActive ? "step" : undefined}
                onClick={() => onSelect?.(index)}
                className={cn(
                  "flex flex-col items-center gap-2 text-center",
                  isReachable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors",
                    isActive || isDone
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                {/* Nazwa pod kółkiem, nie obok — cztery kroki mieszczą się
                    wtedy w kolumnie kasy. Stała szerokość, żeby kreski między
                    kółkami były równe; dłuższa nazwa („Dane kontaktowe") łamie
                    się na dwie linie (zgoda Natalii 2026-10-12). */}
                <span
                  className={cn(
                    "hidden w-[5.75rem] text-[10px] leading-snug tracking-widest uppercase transition-colors sm:block",
                    isActive
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted)]"
                  )}
                >
                  {label}
                </span>
              </button>

              {!isLast && (
                <span
                  className={cn(
                    "mx-1.5 mt-3.5 h-px min-w-3 flex-1 transition-colors",
                    isDone ? "bg-[var(--foreground)]" : "bg-[var(--border)]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
