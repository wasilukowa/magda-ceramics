"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { ConsentChoices } from "@/contracts/shared";
import { useConsent } from "@/lib/store/providers/ConsentProvider";
import { OPTIONAL_CATEGORIES, REJECTED_CHOICES } from "@/lib/helpers/consent";
import { CookieCategoryToggle } from "./CookieCategoryToggle";

// The category panel. Shared by the banner dialog and the cookie policy page,
// so both offer exactly the same choices.
export function CookieSettings({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("cookies");
  const format = useFormatter();
  const { consent, saveChoices, acceptAll, rejectAll } = useConsent();

  // Start from the stored decision; nothing optional is pre-ticked otherwise.
  const [choices, setChoices] = useState<ConsentChoices>(
    consent?.choices ?? REJECTED_CHOICES,
  );

  // This panel also sits permanently on the cookie policy page, where the
  // decision can change underneath it (the footer opens the same panel in a
  // dialog). Re-sync during render so the toggles never show a stale choice.
  const [syncedAt, setSyncedAt] = useState(consent?.decidedAt ?? null);
  if ((consent?.decidedAt ?? null) !== syncedAt) {
    setSyncedAt(consent?.decidedAt ?? null);
    setChoices(consent?.choices ?? REJECTED_CHOICES);
  }

  const toggle = (category: (typeof OPTIONAL_CATEGORIES)[number]) => (
    checked: boolean,
  ) => setChoices((prev) => ({ ...prev, [category]: checked }));

  const handle = (action: () => void) => () => {
    action();
    onDone?.();
  };

  return (
    <div>
      <div className="border-t border-[var(--border)]">
        <CookieCategoryToggle
          label={t("categories.necessary.label")}
          description={t("categories.necessary.description")}
          checked
          locked
          lockedNote={t("alwaysOn")}
          onChange={() => {}}
        />
        {OPTIONAL_CATEGORIES.map((category) => (
          <CookieCategoryToggle
            key={category}
            label={t(`categories.${category}.label`)}
            description={t(`categories.${category}.description`)}
            checked={choices[category]}
            onChange={toggle(category)}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handle(() => saveChoices(choices))}
          className="flex-1 border border-current px-6 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
        >
          {t("save")}
        </button>
        <button
          type="button"
          onClick={handle(rejectAll)}
          className="flex-1 border border-current px-6 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
        >
          {t("rejectAll")}
        </button>
        <button
          type="button"
          onClick={handle(acceptAll)}
          className="flex-1 border border-current px-6 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
        >
          {t("acceptAll")}
        </button>
      </div>

      {consent && (
        <p className="mt-6 text-[11px] tracking-wide text-[var(--muted)]">
          {t("decidedAt", {
            date: format.dateTime(new Date(consent.decidedAt), {
              dateStyle: "long",
              timeStyle: "short",
            }),
          })}
        </p>
      )}
    </div>
  );
}
