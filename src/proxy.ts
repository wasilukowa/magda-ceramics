// Next 16 przemianował konwencję „middleware" na „proxy" — nazwa ma jasno
// mówić, że to warstwa przed aplikacją, a nie middleware w rozumieniu
// Express.js. Sam next-intl nadal dostarcza to pod nazwą middleware.
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

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

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$|.*\\.ico$|api).*)",
  ],
};
