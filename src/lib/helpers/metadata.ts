import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SITE_URL } from "@/content/data";
import { AppRoute } from "@/content/types";
import { ProductImage } from "@/contracts/server/product";
import { getPathname } from "@/i18n/navigation";
import { routing, Locale } from "@/i18n/routing";

export const SITE_NAME = "Magda Ceramics";

// og:locale chce kodu z krajem, nie samego języka.
const OG_LOCALE: Record<Locale, string> = { en: "en_GB", pl: "pl_PL" };

// Domyślny obrazek podglądu — ten sam, co w layoucie. Wymiary trzeba podać,
// bo bez nich część komunikatorów rysuje mały kafelek zamiast szerokiej karty.
export const DEFAULT_OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630 };

// Google chce w opisie ok. 155 znaków; dłuższy i tak zostanie ucięty, tyle że
// w przypadkowym miejscu.
const MAX_DESCRIPTION = 160;

const absolute = (path: string) => new URL(path, SITE_URL).toString();

// Opisy produktów przychodzą z WooCommerce jako HTML (akapity, pogrubienia,
// encje). W metaopisie liczy się goły tekst — znaczniki wyglądałyby w wyniku
// wyszukiwania jak śmieci.
const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

// Ucięcie następuje na granicy słowa — inaczej opis kończy się połową wyrazu.
const truncate = (text: string, limit = MAX_DESCRIPTION): string => {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

export const toMetaDescription = (html: string): string => truncate(stripHtml(html));

type PageMetadataInput = {
  locale: string;
  // Trasa TEJ strony — z niej liczą się `canonical` i odsyłacze do drugiego
  // języka. Podawana jako trasa aplikacji („/shop"), nie gotowy adres, więc
  // zmiana ścieżki w routing.ts przenosi za sobą metadane.
  route: AppRoute;
  // Sam tytuł strony, bez nazwy sklepu — tę dokłada helper.
  title?: string;
  // Opis: albo gotowy tekst (`description`), albo klucz w namespace `meta`
  // (`descriptionKey`), po który helper i tak sięga. Bez żadnego z nich
  // zostaje opis całego sklepu.
  description?: string;
  descriptionKey?: string;
  image?: ProductImage;
};

// Komplet metadanych jednej podstrony: tytuł, opis, canonical z hreflangiem
// i karta podglądu.
//
// ‼️ `openGraph` i `twitter` MUSZĄ tu być podane w całości. Next scala metadane
// z layoutu i strony PŁYTKO — strona, która poda samo `openGraph.title`, gubi
// `siteName`, `type` i obrazek z layoutu.
//
// Helper jest asynchroniczny, bo domyślny opis i tekst alternatywny obrazka
// stoją w tłumaczeniach (namespace `meta`). Dzięki temu strona przekazuje tylko
// to, co ma własnego, zamiast za każdym razem pobierać dwa tłumaczenia.
export async function buildPageMetadata({
  locale,
  route,
  title,
  description,
  descriptionKey,
  image,
}: PageMetadataInput): Promise<Metadata> {
  const current = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: current, namespace: "meta" });

  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, absolute(getPathname({ locale: l, href: route }))])
  ) as Record<Locale, string>;

  const canonical = languages[current];
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const text = description ?? t(descriptionKey ?? "description");
  const images = image
    ? [{ url: image.src, alt: image.alt }]
    : [{ ...DEFAULT_OG_IMAGE, alt: t("ogAlt") }];

  return {
    title: fullTitle,
    description: text,
    alternates: {
      canonical,
      // `x-default` mówi Google, którą wersję pokazać komuś, kto nie mówi ani
      // po polsku, ani po angielsku. To ta sama strona, co domyślna językowo.
      languages: { ...languages, "x-default": languages[routing.defaultLocale] },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[current],
      url: canonical,
      title: fullTitle,
      description: text,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: text,
      images: images.map((i) => i.url),
    },
  };
}
