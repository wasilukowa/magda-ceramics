"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/hooks/useTheme";
import { SwitcherProps, Theme } from "@/contracts/shared";
import { cn } from "@/lib/utils";

// Wygląd w menu na telefonie: JASNY / CIEMNY z zaznaczonym aktywnym — ten sam
// układ co język i waluta w tej samej grupie ustawień. Menu otwiera się
// dopiero po kliknięciu, więc stan z Reacta jest tu już znany.
const OPTIONS = [
  { value: Theme.Light, labelKey: "themeLight" },
  { value: Theme.Dark, labelKey: "themeDark" },
] as const;

export default function ThemeSwitcher({ className }: SwitcherProps) {
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label={t("theme")}
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
            onClick={() => setTheme(option.value)}
            aria-pressed={theme === option.value}
            className={cn(
              "transition-opacity",
              theme === option.value
                ? "text-[var(--foreground)] underline underline-offset-4"
                : "text-[var(--muted)] opacity-70 hover:opacity-100"
            )}
          >
            {t(option.labelKey)}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
