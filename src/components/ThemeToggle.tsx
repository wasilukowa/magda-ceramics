"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/hooks/useTheme";
import { SwitcherProps, Theme } from "@/contracts/shared";
import { cn } from "@/lib/utils";

// Ikonka trybu ciemnego w nagłówku: w jasnym trybie księżyc (kliknij, żeby
// ściemnić), w ciemnym słońce. KTÓRA ikonka jest widoczna, decyduje CSS
// (wariant `dark:`), a nie stan Reacta — serwer nie zna wyboru klienta, więc
// stan z Reacta pokazałby przez chwilę złą ikonkę, zanim strona ożyje.
export default function ThemeToggle({ className }: SwitcherProps) {
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const isDark = theme === Theme.Dark;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? Theme.Light : Theme.Dark)}
      aria-label={t("themeToggle")}
      aria-pressed={isDark}
      className={cn("hover:opacity-60 transition-opacity", className)}
    >
      {/* Księżyc */}
      <svg
        className="dark:hidden"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
      </svg>
      {/* Słońce */}
      <svg
        className="hidden dark:block"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
