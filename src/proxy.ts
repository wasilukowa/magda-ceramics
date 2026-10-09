// Next 16 przemianował konwencję „middleware" na „proxy" — nazwa ma jasno
// mówić, że to warstwa przed aplikacją, a nie middleware w rozumieniu
// Express.js. Sam next-intl nadal dostarcza to pod nazwą middleware.
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { hasLocalePrefix, localeOfUnprefixedPath } from "./lib/helpers/localePath";

const intlMiddleware = createMiddleware(routing);

const UNLOCK_PASSWORD = "ceramika2025";
const COOKIE_NAME = "preview_access";

// Pliki dla wyszukiwarek istnieją w jednym egzemplarzu, bez wersji językowych.
// next-intl przepisałby je na „/pl/robots.txt" i oba zwracałyby 404 — także po
// zdjęciu bramki. Przepuszczamy je więc obok tłumaczenia adresów, ale DOPIERO
// za sprawdzeniem dostępu: dopóki bramka stoi, są zasłonięte razem z resztą.
const SEARCH_ENGINE_FILES = ["/robots.txt", "/sitemap.xml"];

export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/coming-soon") return NextResponse.next();

  const unlockParam = searchParams.get("unlock");
  if (unlockParam === UNLOCK_PASSWORD) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(COOKIE_NAME, "true", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  }

  const hasAccess = request.cookies.get(COOKIE_NAME)?.value === "true";
  if (!hasAccess) {
    return NextResponse.redirect(new URL("/coming-soon", request.url));
  }

  if (SEARCH_ENGINE_FILES.includes(pathname)) return NextResponse.next();

  // LEGACY — adresy bez prefiksu języka, sprzed J4. Do tej zmiany angielski
  // chodził bez prefiksu, więc wszystko, co po tamtym czasie zostało (linki
  // w wysłanych już mailach, zakładki, powrót ze Stripe'a z płatności zaczętej
  // przed wdrożeniem), wygląda jak „/about” albo „/order?…”. Język takiego
  // adresu ustalamy z niego samego (localeOfUnprefixedPath) i przenosimy go na
  // stałe pod właściwy prefiks. Oddany next-intl zostałby przypisany językowi
  // z ciasteczka — czyli dokładnie błąd J4. Strona główna „/” zostaje dla
  // next-intl: tam wybór języka wg ciasteczka i przeglądarki jest zamierzony.
  if (pathname !== "/" && !hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeOfUnprefixedPath(pathname)}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // `fonts/` — krój dla formularza Stripe'a: ramka Stripe'a nie ma naszego
    // ciasteczka bramki, a przekierowanie zamiast pliku zostawiłoby ją bez kroju.
    "/((?!_next/static|_next/image|fonts/|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$|.*\\.ico$|api).*)",
  ],
};
