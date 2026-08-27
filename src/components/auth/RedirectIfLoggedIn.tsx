import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/dal";

type Href = Parameters<typeof redirect>[0]["href"];

// Zalogowanego klienta odsyłamy z logowania i rejestracji tam, gdzie chciał
// trafić. Bramka mieszka w osobnym komponencie, bo czyta ciasteczko sesji —
// opakowana w <Suspense> pozwala reszcie strony (nagłówek, formularz) wejść do
// statycznej skorupy, zamiast czekać na odczyt przy każdym wejściu.
export default async function RedirectIfLoggedIn({
  locale,
  href,
}: {
  locale: string;
  href: Href;
}) {
  const session = await getSession();
  if (session) redirect({ href, locale });

  return null;
}
