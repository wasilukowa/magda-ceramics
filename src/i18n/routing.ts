import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pl"],
  defaultLocale: "en",
  // Prefiks przy OBU językach (J4). Przy „as-needed” angielski chodził bez
  // prefiksu, więc goły adres był niejednoznaczny: ciasteczko NEXT_LOCALE
  // przerzucało angielski link na polską wersję („/about” → „/pl/o-mnie”).
  // Teraz język siedzi w każdym adresie, a ciasteczko i przeglądarka
  // decydują wyłącznie na stronie głównej „/”. Stare angielskie adresy bez
  // prefiksu przekierowuje proxy (patrz LEGACY w proxy.ts).
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/shop": { en: "/shop", pl: "/sklep" },
    // UWAGA: musi stać PRZED „/shop/[category]" i mieć własny plik strony —
    // inaczej „archiwum" wyglądałoby jak nazwa kategorii. Next daje
    // pierwszeństwo trasie statycznej, ale kolejność tutaj trzyma to jasnym.
    "/shop/archive": { en: "/shop/archive", pl: "/sklep/archiwum" },
    "/shop/[category]": { en: "/shop/[category]", pl: "/sklep/[category]" },
    "/product/[slug]": { en: "/product/[slug]", pl: "/produkt/[slug]" },
    "/contact": { en: "/contact", pl: "/kontakt" },
    "/checkout": "/checkout",
    "/checkout/success": "/checkout/success",
    // Strona jednego zamówienia otwierana z maila (numer + klucz zamówienia,
    // bez logowania): zapłata, anulowanie, stan.
    "/order": { en: "/order", pl: "/zamowienie" },
    "/coming-soon": "/coming-soon",
    "/about": { en: "/about", pl: "/o-mnie" },
    "/about/ceramics": { en: "/about/my-ceramics", pl: "/o-mnie/moja-ceramika" },
    "/reviews": { en: "/reviews", pl: "/opinie" },
    "/faq": { en: "/faq", pl: "/pytania-i-odpowiedzi" },
    "/shipping": { en: "/shipping-and-returns", pl: "/wysylka-i-zwroty" },
    "/terms": { en: "/terms", pl: "/regulamin" },
    "/privacy": { en: "/privacy", pl: "/polityka-prywatnosci" },
    "/cookies": { en: "/cookies", pl: "/pliki-cookies" },
    "/sitemap": { en: "/sitemap", pl: "/mapa-strony" },
    "/login": { en: "/login", pl: "/logowanie" },
    "/register": { en: "/register", pl: "/rejestracja" },
    "/forgot-password": { en: "/forgot-password", pl: "/nie-pamietam-hasla" },
    "/reset-password": { en: "/reset-password", pl: "/nowe-haslo" },
    "/account": { en: "/account", pl: "/konto" },
    "/account/orders": { en: "/account/orders", pl: "/konto/zamowienia" },
    "/account/orders/pay": {
      en: "/account/orders/pay",
      pl: "/konto/zamowienia/zaplac",
    },
    "/account/details": { en: "/account/details", pl: "/konto/dane" },
    "/wishlist": { en: "/wishlist", pl: "/ulubione" },
  },
});

export type Locale = (typeof routing.locales)[number];
