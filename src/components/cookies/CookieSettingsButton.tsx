"use client";

import { useTranslations } from "next-intl";
import { useConsentActions } from "@/lib/store/providers/ConsentProvider";

// Permanent way back to the panel — withdrawing consent has to be as easy as
// giving it, so this sits in the footer on every page.
export function CookieSettingsButton() {
  const t = useTranslations("cookies");
  const { openSettings } = useConsentActions();

  return (
    <button
      type="button"
      onClick={openSettings}
      className="hover:opacity-60 transition-opacity"
    >
      {t("settings")}
    </button>
  );
}
