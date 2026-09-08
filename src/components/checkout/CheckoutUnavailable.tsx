"use client";

import { useTranslations } from "next-intl";
import { UnavailableItem } from "@/contracts/server/checkout";
import { getUnavailableReasonKey } from "@/lib/helpers/checkout";

type Props = {
  items: UnavailableItem[];
  // Wyrzuca wypisane prace z koszyka i wraca do zamówienia.
  onRemove: () => void;
};

// Ceramika to pojedyncze sztuki, więc „ktoś był szybszy" to zwykły przypadek,
// nie awaria. Klient ma to zobaczyć, zanim zapłaci, i móc jednym kliknięciem
// zamówić resztę koszyka.
export default function CheckoutUnavailable({ items, onRemove }: Props) {
  const t = useTranslations("checkout");

  return (
    <div className="border border-[var(--border)] p-6 space-y-5">
      <div>
        <p className="text-xs tracking-widest uppercase mb-2">
          {t("soldOutTitle")}
        </p>
        <p className="text-sm text-[var(--muted)]">{t("soldOutIntro")}</p>
      </div>

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-sm">
            {item.name}{" "}
            <span className="text-[var(--muted)]">
              ({t(getUnavailableReasonKey(item.reason))})
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onRemove}
        className="w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 hover:opacity-80 transition-opacity"
      >
        {t("soldOutRemove")}
      </button>
    </div>
  );
}
