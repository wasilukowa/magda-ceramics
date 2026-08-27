"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/lib/store/providers/ConsentProvider";
import { CookieSettingsDialog } from "./CookieSettingsDialog";

// First layer: plain wording plus three equally weighted choices. Accepting
// and rejecting are both one click — required by art. 7(3) GDPR and the EDPB
// dark-pattern guidelines.
function CookieBannerBar() {
  const t = useTranslations("cookies");
  const { isBannerVisible, isSettingsOpen, acceptAll, rejectAll, openSettings } =
    useConsent();

  if (!isBannerVisible || isSettingsOpen) return null;

  return (
    <div
      role="region"
      aria-label={t("bannerTitle")}
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--background)]"
    >
      <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1">
          <p className="text-xs tracking-[0.25em] uppercase text-[var(--muted)] mb-3">
            {t("bannerTitle")}
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            {t("bannerText")}{" "}
            <Link href="/cookies" className="text-[var(--foreground)] underline">
              {t("policyLink")}
            </Link>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          <button
            type="button"
            onClick={openSettings}
            className="border border-current px-6 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
          >
            {t("settings")}
          </button>
          {/* Reject and accept are deliberately identical in size and
              colour — giving "accept" the prettier button is exactly the
              dark pattern the EDPB guidelines rule out. */}
          <button
            type="button"
            onClick={rejectAll}
            className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-6 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
          >
            {t("rejectAll")}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-6 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
          >
            {t("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieBanner() {
  // Pasek czeka na zgodę odczytaną z ciasteczka, więc siedzi we własnej granicy
  // <Suspense> — reszta strony renderuje się bez niego. Wracający klient nie
  // zobaczy mignięcia banera: dopóki zgoda nie jest znana, nie ma tu nic.
  // Panel ustawień stoi POZA tą granicą, bo otwiera go też link w stopce.
  return (
    <>
      <Suspense fallback={null}>
        <CookieBannerBar />
      </Suspense>
      <CookieSettingsDialog />
    </>
  );
}
