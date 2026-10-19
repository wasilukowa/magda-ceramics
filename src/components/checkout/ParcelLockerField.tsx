"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { InPostPoint } from "@/contracts/server/shipping";
import { SavedLocker } from "@/contracts/server/auth";
import { isSavedLocker, toInPostPoint } from "@/lib/helpers/savedDelivery";
import { cn } from "@/lib/utils";
import LockerMapDialog from "./LockerMapDialog";

type Props = {
  country: string;
  locker: InPostPoint | null;
  onSelect: (point: InPostPoint) => void;
  // Paczkomaty z konta klienta w tym kraju (prośba Natalii 2026-10-19).
  savedLockers: SavedLocker[];
  // „Dodaj do moich paczkomatów" — pod paczkomatem spoza tej listy.
  saveButton: React.ReactNode;
};

const LOCKER_CARD_CLASS = "w-full border px-3 py-3 text-sm text-left space-y-1";

export default function ParcelLockerField({
  country,
  locker,
  onSelect,
  savedLockers,
  saveButton,
}: Props) {
  const t = useTranslations("checkout");
  const [open, setOpen] = useState(false);
  const chosenOutsideSaved = locker !== null && !isSavedLocker(savedLockers, locker.code);

  function handleSelect(point: InPostPoint) {
    onSelect(point);
    setOpen(false);
  }

  return (
    <div>
      <label className="block text-[10px] tracking-widest uppercase text-[var(--muted)] mb-1.5">
        {t("parcelLocker")}
      </label>

      {savedLockers.length > 0 && (
        <div className="space-y-2 mb-2">
          <p className="text-xs text-[var(--muted)]">{t("savedLockers")}</p>
          {savedLockers.map((saved) => {
            const selected = locker?.code === saved.code;
            return (
              <button
                key={saved.code}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(toInPostPoint(saved))}
                className={cn(
                  LOCKER_CARD_CLASS,
                  "transition-colors",
                  selected
                    ? "border-[var(--foreground)]"
                    : "border-[var(--color-control-border)] hover:border-[var(--foreground)]"
                )}
              >
                <span className="block font-medium">{saved.code}</span>
                <span className="block text-[var(--muted)] text-xs">
                  {[saved.description, [saved.postCode, saved.city].filter(Boolean).join(" ")]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {chosenOutsideSaved ? (
        <div className="space-y-3">
          <div className={cn(LOCKER_CARD_CLASS, "border-[var(--color-control-border)]")}>
            <p className="font-medium">{locker.code}</p>
            {locker.description && (
              <p className="text-[var(--muted)] text-xs">{locker.description}</p>
            )}
            {(locker.postCode || locker.city) && (
              <p className="text-[var(--muted)] text-xs">
                {[locker.postCode, locker.city].filter(Boolean).join(" ")}
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[10px] tracking-widest uppercase underline mt-1 hover:text-[var(--muted)] transition-colors"
            >
              {t("changeLocker")}
            </button>
          </div>
          {saveButton}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full border border-[var(--color-control-border)] px-3 py-3 text-sm text-left hover:border-[var(--foreground)] transition-colors"
        >
          {savedLockers.length > 0 ? t("otherLocker") : t("chooseLocker")}
        </button>
      )}

      {open && (
        <LockerMapDialog country={country} onSelect={handleSelect} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
