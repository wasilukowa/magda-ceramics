"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { InPostPoint } from "@/contracts/server/shipping";
import InPostGeowidget from "./InPostGeowidget";

type Props = {
  locker: InPostPoint | null;
  onSelect: (point: InPostPoint) => void;
};

export default function ParcelLockerField({ locker, onSelect }: Props) {
  const t = useTranslations("checkout");
  const [open, setOpen] = useState(false);

  function handleSelect(point: InPostPoint) {
    onSelect(point);
    setOpen(false);
  }

  return (
    <div>
      <label className="block text-[10px] tracking-widest uppercase text-[var(--muted)] mb-1.5">
        {t("parcelLocker")}
      </label>

      {locker ? (
        <div className="border border-[var(--border)] px-3 py-3 text-sm space-y-1">
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
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full border border-[var(--border)] px-3 py-3 text-sm text-left hover:border-[var(--foreground)] transition-colors"
        >
          {t("chooseLocker")}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--background)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <p className="text-xs tracking-widest uppercase">
                {t("chooseLocker")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
                aria-label={t("closeLocker")}
              >
                ✕
              </button>
            </div>
            <InPostGeowidget onSelect={handleSelect} />
          </div>
        </div>
      )}
    </div>
  );
}
