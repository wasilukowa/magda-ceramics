"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SavedLocker } from "@/contracts/server/auth";
import { InPostPoint } from "@/contracts/server/shipping";
import { INPOST_LOCKER_COUNTRIES } from "@/content/data";
import { deleteLocker, saveAccountLocker } from "@/server-actions/addresses";
import { getLockerLines, MAX_SAVED_ITEMS, toSavedLocker } from "@/lib/helpers/savedDelivery";
import { getCountryLabel } from "@/lib/helpers/shipping";
import { buttonClass } from "@/components/ui/button";
import { ButtonVariant } from "@/contracts/shared";
import LockerMapDialog from "@/components/checkout/LockerMapDialog";
import { ACCOUNT_LINK_CLASS } from "./AddressBook";

// Otwarta mapa: w którym kraju i który zapisany paczkomat zmienia (bez
// `replaces` — dodaje nowy).
type MapState = { country: string; replaces?: string };

// „Twoje paczkomaty" w zakładce „Adresy" (prośba Natalii 2026-10-19). Kasa
// wybiera najnowszy z kraju dostawy, a pozostałe pokazuje do wyboru.
export default function LockerBook({ lockers }: { lockers: SavedLocker[] }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [country, setCountry] = useState("PL");
  const [map, setMap] = useState<MapState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function save(point: InPostPoint) {
    if (!map) return;
    const { country: lockerCountry, replaces } = map;
    setMap(null);
    setError(null);
    startSaving(async () => {
      const saved = await saveAccountLocker(toSavedLocker(point, lockerCountry), replaces);
      if (!saved) setError(t("addresses.failed"));
    });
  }

  function remove(code: string) {
    setError(null);
    startSaving(async () => {
      if (!(await deleteLocker(code))) setError(t("addresses.failed"));
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {lockers.length === 0 && (
        <p className="text-sm text-[var(--muted)]">{t("addresses.emptyLockers")}</p>
      )}

      {lockers.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-4">
          {lockers.map((locker) => (
            <li
              key={locker.code}
              className="border border-[var(--color-control-border)] p-5 flex flex-col gap-4"
            >
              <div className="text-sm leading-relaxed">
                <p className="font-medium">{locker.code}</p>
                {getLockerLines(locker, locale).map((line) => (
                  <p key={line} className="text-[var(--muted)]">
                    {line}
                  </p>
                ))}
              </div>
              <div className="flex gap-5">
                <button
                  type="button"
                  onClick={() => setMap({ country: locker.country, replaces: locker.code })}
                  disabled={saving}
                  className={ACCOUNT_LINK_CLASS}
                >
                  {t("addresses.change")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(locker.code)}
                  disabled={saving}
                  className={ACCOUNT_LINK_CLASS}
                >
                  {t("addresses.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lockers.length < MAX_SAVED_ITEMS && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
              {t("addresses.lockerCountry")}
            </span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border border-[var(--color-control-border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
            >
              {INPOST_LOCKER_COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {getCountryLabel(code, locale)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setMap({ country })}
            disabled={saving}
            className={buttonClass({ variant: ButtonVariant.Secondary })}
          >
            {t("addresses.addLocker")}
          </button>
        </div>
      )}

      {error && (
        <p aria-live="polite" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}

      {map && (
        <LockerMapDialog country={map.country} onSelect={save} onClose={() => setMap(null)} />
      )}
    </div>
  );
}
