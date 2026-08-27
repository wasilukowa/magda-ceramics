import "server-only";

import { cookies } from "next/headers";
import { CookieConsent } from "@/contracts/shared";
import { CONSENT_COOKIE_NAME, parseConsentCookie } from "@/lib/helpers/consent";

// Odczyt zgody po stronie serwera. Osobny plik, bo `next/headers` nie może
// trafić do przeglądarki, a reszta helpera od zgód (parsowanie, zapis) jest
// wspólna dla serwera i klienta.
//
// Layout woła to BEZ `await` i podaje obietnicę dalej — dzięki temu odczyt
// ciasteczka nie odbiera stronie statyczności; patrz ConsentProvider.
export async function getServerConsent(): Promise<CookieConsent | null> {
  const cookieStore = await cookies();
  return parseConsentCookie(cookieStore.get(CONSENT_COOKIE_NAME)?.value);
}
