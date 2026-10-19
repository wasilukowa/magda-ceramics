"use client";

import { useTranslations } from "next-intl";
import { InPostPoint } from "@/contracts/server/shipping";
import InPostGeowidget from "./InPostGeowidget";

type Props = {
  country: string;
  onSelect: (point: InPostPoint) => void;
  onClose: () => void;
};

// Mapa paczkomatów InPostu w okienku na środku ekranu — w kasie i w koncie
// („Twoje paczkomaty"). Kliknięcie obok okienka je zamyka.
export default function LockerMapDialog({ country, onSelect, onClose }: Props) {
  const t = useTranslations("checkout");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--background)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <p className="text-xs tracking-widest uppercase">{t("chooseLocker")}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
            aria-label={t("closeLocker")}
          >
            ✕
          </button>
        </div>
        <InPostGeowidget country={country} onSelect={onSelect} />
      </div>
    </div>
  );
}
