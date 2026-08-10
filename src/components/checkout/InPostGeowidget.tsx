"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { InPostPoint } from "@/contracts/server/shipping";

// Poland uses the domestic Geowidget; every other supported country uses the
// InPost International Geowidget. Both take the same public token and fire the
// same point event — they only differ in the host they load from and the
// `country` attribute (International needs it to scope + centre the map).
const PL_BASE = "https://geowidget.inpost.pl";
const INTL_BASE = "https://geowidget.inpost-group.com";

const widgetBase = (country: string) =>
  country === "PL" ? PL_BASE : INTL_BASE;

// DOM event the widget fires (via the `onpoint` attribute) once a point is
// picked. The chosen point arrives in the event's detail.
const POINT_EVENT = "inpostPointSelected";

// Raw shape InPost hands back on point selection — only the fields we map.
type RawInPostPoint = {
  name?: string;
  address?: { line1?: string; line2?: string };
  address_details?: { city?: string; post_code?: string };
};

function mapPoint(raw: RawInPostPoint): InPostPoint | null {
  if (!raw?.name) return null;
  return {
    code: raw.name,
    description: [raw.address?.line1, raw.address?.line2]
      .filter(Boolean)
      .join(", "),
    city: raw.address_details?.city ?? "",
    postCode: raw.address_details?.post_code ?? "",
  };
}

type Props = {
  // ISO code of the shipping country; selects the SDK (PL vs International) and,
  // for International, scopes the map and centres it on this country.
  country: string;
  onSelect: (point: InPostPoint) => void;
};

export default function InPostGeowidget({ country, onSelect }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  // Track which SDK has loaded rather than a plain boolean, so the loading
  // overlay reappears automatically when the script URL changes (PL ↔ Intl).
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;

  const isPl = country === "PL";
  const base = widgetBase(country);
  const scriptUrl = `${base}/inpost-geowidget.js`;
  const cssUrl = `${base}/inpost-geowidget.css`;
  const ready = loadedUrl === scriptUrl;

  // The widget fires a DOM event (named by the `onpoint` attribute) on the
  // document; we map the payload to our domain point and bubble it up.
  useEffect(() => {
    function handle(event: Event) {
      const detail =
        (event as CustomEvent).detail ??
        (event as unknown as { details?: RawInPostPoint }).details;
      const point = mapPoint(detail ?? {});
      if (point) onSelect(point);
    }

    document.addEventListener(POINT_EVENT, handle);
    return () => document.removeEventListener(POINT_EVENT, handle);
  }, [onSelect]);

  // Load the active widget's stylesheet once (PL and International ship their
  // own; switching country may bring in a second one — both are harmless).
  useEffect(() => {
    if (document.querySelector(`link[href="${cssUrl}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl;
    document.head.appendChild(link);
  }, [cssUrl]);

  if (!token) {
    return (
      <p className="text-sm text-red-600 py-8 text-center">
        {t("lockerUnavailable")}
      </p>
    );
  }

  return (
    <div className="relative h-[480px] w-full">
      <Script
        key={scriptUrl}
        src={scriptUrl}
        onReady={() => setLoadedUrl(scriptUrl)}
        onLoad={() => setLoadedUrl(scriptUrl)}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-ceramic)] animate-pulse">
          <p className="text-xs tracking-widest uppercase text-[var(--muted)]">
            {t("lockerLoading")}
          </p>
        </div>
      )}
      <inpost-geowidget
        // Remount on country change so the widget re-reads `country` and
        // re-centres the map (the International SDK reads it on init).
        key={country}
        token={token}
        language={locale === "pl" ? "pl" : "en"}
        config="parcelCollect"
        country={isPl ? undefined : country}
        onpoint={POINT_EVENT}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
