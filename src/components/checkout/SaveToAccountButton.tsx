"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

type Props = {
  label: string;
  // Już na liście w koncie — przycisk znika.
  isSaved: boolean;
  // Tylko zalogowany ma gdzie zapisać; gość widzi przycisk nieaktywny
  // (prośba Natalii 2026-10-19).
  canSave: boolean;
  // True — zapisane.
  onSave: () => Promise<boolean>;
};

// „Dodaj do moich paczkomatów" / „Dodaj do moich adresów" w kasie. Rysowany
// z `key` wybranego paczkomatu albo adresu, więc „Zapisane" po zapisie nie
// przechodzi na następny.
export default function SaveToAccountButton({ label, isSaved, canSave, onSave }: Props) {
  const t = useTranslations("checkout");
  const [saving, startSaving] = useTransition();
  const [justSaved, setJustSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  if (isSaved) {
    return justSaved ? (
      <p aria-live="polite" className="text-xs text-[var(--color-success)]">
        ✓ {t("savedInAccount")}
      </p>
    ) : null;
  }

  function save() {
    setFailed(false);
    startSaving(async () => {
      if (await onSave()) setJustSaved(true);
      else setFailed(true);
    });
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={save}
        disabled={!canSave || saving}
        className="border border-[var(--color-control-border)] px-3 py-2 text-[10px] tracking-widest uppercase hover:border-[var(--foreground)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--color-control-border)]"
      >
        + {label}
      </button>
      {!canSave && <p className="text-xs text-[var(--muted)]">{t("saveNeedsLogin")}</p>}
      {failed && (
        <p aria-live="polite" className="text-xs text-[var(--color-error)]">
          {t("saveFailed")}
        </p>
      )}
    </div>
  );
}
