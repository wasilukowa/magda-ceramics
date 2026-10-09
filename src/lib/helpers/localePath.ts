import { routing, type Locale } from "@/i18n/routing";

// Szablon trasy z routing.ts („/sklep/[category]”) jako wyrażenie regularne:
// parametr w nawiasach to jeden dowolny człon adresu.
const toPattern = (template: string): RegExp =>
  new RegExp(`^${template.replace(/\[[^\]]+\]/g, "[^/]+")}/?$`);

const matchesLocale = (pathname: string, locale: Locale): boolean =>
  Object.values(routing.pathnames).some((config) =>
    toPattern(typeof config === "string" ? config : config[locale]).test(pathname)
  );

export const hasLocalePrefix = (pathname: string): boolean =>
  routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

// Język adresu, który przyszedł BEZ prefiksu (J4). Przed zmianą bez prefiksu
// chodził angielski, więc stare linki („/about”, „/order?…”) są angielskie.
// Polskie słowo w adresie („/sklep”, „/o-mnie”) to za to ktoś, kto wpisał
// adres z głowy albo z posta Magdy — ten ma trafić na polską wersję.
// Wszystko inne, także adres nieznany, idzie do języka domyślnego.
export const localeOfUnprefixedPath = (pathname: string): Locale => {
  if (matchesLocale(pathname, routing.defaultLocale)) return routing.defaultLocale;
  return (
    routing.locales.find((locale) => matchesLocale(pathname, locale)) ??
    routing.defaultLocale
  );
};
