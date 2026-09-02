"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { InPostPoint } from "@/contracts/server/shipping";

// ONE widget for every country we ship lockers to, Poland included.
//
// InPost publishes two SDKs — a domestic one (geowidget.inpost.pl) and an
// International one — and both register the SAME custom element name. Only the
// first `customElements.define` wins, so loading both left whichever map the
// customer opened first in charge of every later one: after a Polish map, the
// French map ignored `country` and stayed centred on Warsaw. The International
// SDK covers all eight locker countries (PL, FR, NL, BE, IT, ES, PT, LU — the
// same list as INPOST_LOCKER_COUNTRIES), so using it everywhere removes the
// clash instead of trying to sequence around it.
const WIDGET_BASE = "https://geowidget.inpost-group.com";
const SCRIPT_URL = `${WIDGET_BASE}/inpost-geowidget.js`;
const CSS_URL = `${WIDGET_BASE}/inpost-geowidget.css`;

// DOM event the widget fires (via the `onpoint` attribute) once a point is
// picked. The chosen point arrives in the event's detail.
const POINT_EVENT = "inpostPointSelected";

// Custom element the SDK registers. We build it by hand (see the effect below)
// instead of writing it in JSX, so React never touches its properties.
const WIDGET_TAG = "inpost-geowidget";

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
  // ISO code of the shipping country: scopes the map to that country's lockers
  // and centres it there.
  country: string;
  onSelect: (point: InPostPoint) => void;
};

export default function InPostGeowidget({ country, onSelect }: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
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

  // The widget ships its own stylesheet; load it once per page.
  useEffect(() => {
    if (document.querySelector(`link[href="${CSS_URL}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_URL;
    document.head.appendChild(link);
  }, []);

  // Build the widget by hand once its SDK has loaded.
  //
  // ‼️ DO NOT PUT <inpost-geowidget …> BACK IN JSX. Before the SDK registers
  // the element React writes plain attributes and all is well — but on every
  // later opening of the map the element is already registered, so React sets
  // `token` as a PROPERTY, and InPost's class exposes only a getter for it.
  // The resulting "Cannot set property token" is caught by nobody and takes the
  // whole checkout down to the error screen. The first opening always worked,
  // which is how this survived in production from June to September.
  //
  // The node is built OUTSIDE the document on purpose: `createElement` runs the
  // constructor immediately, while `connectedCallback` — which reads the token
  // and boots the map — waits for insertion. Hence attributes first, append last.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !ready || !token) return;

    const attributes: Record<string, string> = {
      token,
      language: locale === "pl" ? "pl" : "en",
      config: "parcelCollect",
      onpoint: POINT_EVENT,
      // Comma-separated ISO codes; the first one sets the map's default
      // position. One code means: only this country's points, centred there.
      country,
    };

    const widget = document.createElement(WIDGET_TAG);
    for (const [name, value] of Object.entries(attributes)) {
      widget.setAttribute(name, value);
    }
    widget.style.width = "100%";
    widget.style.height = "100%";
    widget.style.display = "block";
    host.appendChild(widget);

    // Country change rebuilds the widget, so the map re-centres on the new one.
    return () => widget.remove();
  }, [ready, token, locale, country]);

  if (!token) {
    return (
      <p className="text-sm text-[var(--color-error)] py-8 text-center">
        {t("lockerUnavailable")}
      </p>
    );
  }

  return (
    <div className="relative h-[480px] w-full">
      <Script
        src={SCRIPT_URL}
        onReady={() => setReady(true)}
        onLoad={() => setReady(true)}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-ceramic)] animate-pulse">
          <p className="text-xs tracking-widest uppercase text-[var(--muted)]">
            {t("lockerLoading")}
          </p>
        </div>
      )}
      <div ref={hostRef} className="w-full h-full" />
    </div>
  );
}
