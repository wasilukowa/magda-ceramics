"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { InPostPoint } from "@/contracts/server/shipping";

const GEOWIDGET_JS = "https://geowidget.inpost.pl/inpost-geowidget.js";
const GEOWIDGET_CSS = "https://geowidget.inpost.pl/inpost-geowidget.css";
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
  onSelect: (point: InPostPoint) => void;
};

export default function InPostGeowidget({ onSelect }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  const token = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;

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

  // Load the widget stylesheet once.
  useEffect(() => {
    if (document.querySelector(`link[href="${GEOWIDGET_CSS}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GEOWIDGET_CSS;
    document.head.appendChild(link);
  }, []);

  if (!token) {
    return (
      <p className="text-sm text-red-600 py-8 text-center">
        {t("lockerUnavailable")}
      </p>
    );
  }

  return (
    <div className="relative h-[480px] w-full">
      <Script src={GEOWIDGET_JS} onLoad={() => setReady(true)} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-ceramic)] animate-pulse">
          <p className="text-xs tracking-widest uppercase text-[var(--muted)]">
            {t("lockerLoading")}
          </p>
        </div>
      )}
      <inpost-geowidget
        token={token}
        language={locale === "pl" ? "pl" : "en"}
        config="parcelCollect"
        onpoint={POINT_EVENT}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
