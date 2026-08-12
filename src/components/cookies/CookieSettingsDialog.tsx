"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/lib/store/providers/ConsentProvider";
import { CookieSettings } from "./CookieSettings";

// Second layer of the banner: the same panel the cookie policy page shows.
export function CookieSettingsDialog() {
  const t = useTranslations("cookies");
  const { isSettingsOpen, closeSettings } = useConsent();

  useEffect(() => {
    if (!isSettingsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSettings();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("settingsTitle")}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        type="button"
        aria-label={t("close")}
        onClick={closeSettings}
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-[var(--background)] px-6 sm:px-10 py-10 shadow-xl">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
          {t("settingsTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--muted)] mb-8">
          {t("settingsIntro")}{" "}
          <Link
            href="/cookies"
            onClick={closeSettings}
            className="text-[var(--foreground)] underline"
          >
            {t("policyLink")}
          </Link>
        </p>

        <CookieSettings onDone={closeSettings} />
      </div>
    </div>
  );
}
