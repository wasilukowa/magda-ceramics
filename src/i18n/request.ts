import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

// Skąd bierzemy język zależy od tego, CO renderujemy.
//
// · Strony: z adresu, przez `next/root-params`. Przy Cache Components to
//   jedyny sposób, który nie robi ze strony treści dynamicznej — czytanie
//   nagłówków zabiłoby statyczne renderowanie całego serwisu.
// · Akcje serwerowe (formularze: rejestracja, logowanie, kontakt, konto):
//   `root-params` RZUCA tam wyjątkiem — „can only be called in the context
//   of a route". Bez tego zapasowego toru każdy formularz kończył się
//   błędem 500 i komunikatem „coś poszło nie tak". Akcja i tak jest
//   dynamiczna, więc nagłówek od proxy (`requestLocale`) jest tu w porządku.
const resolveLocale = async (
  requestLocale: Promise<string | undefined>,
): Promise<string | undefined> => {
  try {
    return await rootLocale();
  } catch {
    return await requestLocale;
  }
};

export default getRequestConfig(async ({ locale: explicit, requestLocale }) => {
  // `explicit` przychodzi z wywołań w rodzaju `getTranslations({ locale })`.
  const requested = hasLocale(routing.locales, explicit)
    ? explicit
    : await resolveLocale(requestLocale);

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
