"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Catches render/fetch failures below the locale layout — a WooCommerce outage
// on the shop page, for instance — instead of showing the Next.js error screen.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
      <h1 className="text-2xl font-light tracking-wide">{t("heading")}</h1>
      <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md">
        {t("text")}
      </p>

      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <button
          type="button"
          onClick={reset}
          className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="text-xs tracking-widest uppercase border border-[var(--color-control-border)] px-8 py-3 hover:border-[var(--foreground)] transition-colors"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
