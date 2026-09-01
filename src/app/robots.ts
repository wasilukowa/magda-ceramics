import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/content/data";
import { StaticRoute } from "@/content/types";

// Strony, które nie mają czego szukać w wynikach wyszukiwania: kasa, konto
// klienta, logowanie, ulubione i zaślepka sprzed premiery. Adresy liczymy
// dla obu języków, więc polska „/pl/konto" jest wykluczona tak samo jak
// angielska „/account" — bez przepisywania ich ręcznie.
const PRIVATE_ROUTES: StaticRoute[] = [
  "/checkout",
  "/checkout/success",
  "/account",
  "/account/orders",
  "/account/details",
  "/login",
  "/register",
  "/wishlist",
];

// Zaślepka żyje poza [locale], więc nie ma wersji językowych — inaczej trafiłby
// tu nieistniejący „/pl/coming-soon".
const GATE_PATH = "/coming-soon";

export default function robots(): MetadataRoute.Robots {
  const disallow = routing.locales.flatMap((locale) =>
    PRIVATE_ROUTES.map((href) => getPathname({ locale, href }))
  );

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...new Set([...disallow, GATE_PATH])],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
