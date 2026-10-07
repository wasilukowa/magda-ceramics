import { ButtonSize, ButtonVariant } from "@/contracts/shared";
import { cn } from "@/lib/utils";

// Wspólny wygląd przycisków (decyzja Natalii 2026-10-07): sam obrys wyglądał
// jak przycisk nieaktywny, więc główne akcje mają czarne tło, biały napis
// i strzałkę. W trybie ciemnym kolory się odwracają razem z całą paletą.
// Klasy, a nie komponent, bo ten sam wygląd noszą i <button>, i <Link>.
// Przełączniki (filtry, paczkomat/kurier) NIE używają tego stylu — tam
// wypełnienie znaczy „wybrane", a obrys „niewybrane".

const BASE =
  "inline-flex items-center justify-center gap-3 text-center text-xs tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed";

const VARIANTS: Record<ButtonVariant, string> = {
  [ButtonVariant.Primary]:
    "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]",
  [ButtonVariant.Secondary]:
    "border border-[var(--foreground)] text-[var(--foreground)]",
};

const SIZES: Record<ButtonSize, string> = {
  [ButtonSize.Default]: "px-8 py-3",
  [ButtonSize.Block]: "w-full px-4 py-4",
};

export const buttonClass = ({
  variant = ButtonVariant.Primary,
  size = ButtonSize.Default,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string => cn(BASE, VARIANTS[variant], SIZES[size], className);

// Strzałka przy głównych przyciskach. Ozdoba — czytnik ekranu jej nie czyta.
export function ButtonArrow() {
  return <span aria-hidden="true">→</span>;
}
