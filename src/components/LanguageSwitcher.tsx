"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { SwitcherProps } from "@/contracts/shared";
import { cn } from "@/lib/utils";

// Kolejność wyświetlania (polski pierwszy, jak „PLN / EUR"), niezależna od
// routing.locales, gdzie pierwszy jest język domyślny.
const LABELS: Record<Locale, string> = { pl: "PL", en: "EN" };
const ORDER = Object.keys(LABELS) as Locale[];

// Same shape as the currency switcher: both options on screen with the active
// one marked, rather than a single button showing the language you are *not*
// reading.
export default function LanguageSwitcher({ className }: SwitcherProps) {
  const t = useTranslations("nav");
  const active = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  const select = (next: Locale) => {
    if (next === active) return;
    // @ts-expect-error -- pathname and params always match the current route
    router.replace({ pathname, params }, { locale: next });
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "flex items-center gap-1.5 text-xs tracking-widest uppercase",
        className
      )}
    >
      {ORDER.map((locale, index) => (
        <Fragment key={locale}>
          {index > 0 && (
            <span aria-hidden="true" className="text-[var(--muted)] opacity-40">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => select(locale)}
            aria-pressed={locale === active}
            className={cn(
              "transition-opacity",
              locale === active
                ? "text-[var(--foreground)] underline underline-offset-4"
                : "text-[var(--muted)] opacity-70 hover:opacity-100"
            )}
          >
            {LABELS[locale]}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
