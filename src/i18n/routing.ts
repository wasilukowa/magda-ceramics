import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pl"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/shop": { en: "/shop", pl: "/sklep" },
    "/shop/[category]": { en: "/shop/[category]", pl: "/sklep/[category]" },
    "/product/[slug]": { en: "/product/[slug]", pl: "/produkt/[slug]" },
    "/contact": { en: "/contact", pl: "/kontakt" },
    "/checkout": "/checkout",
    "/checkout/success": "/checkout/success",
    "/coming-soon": "/coming-soon",
    "/about": { en: "/about", pl: "/o-mnie" },
    "/terms": { en: "/terms", pl: "/regulamin" },
    "/privacy": { en: "/privacy", pl: "/polityka-prywatnosci" },
  },
});

export type Locale = (typeof routing.locales)[number];
