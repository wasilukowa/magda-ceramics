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
    "/login": { en: "/login", pl: "/logowanie" },
    "/register": { en: "/register", pl: "/rejestracja" },
    "/account": { en: "/account", pl: "/konto" },
    "/account/orders": { en: "/account/orders", pl: "/konto/zamowienia" },
    "/account/details": { en: "/account/details", pl: "/konto/dane" },
    "/wishlist": { en: "/wishlist", pl: "/ulubione" },
  },
});

export type Locale = (typeof routing.locales)[number];
