import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTimeZone,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/store/providers/CartProvider";
import { CurrencyProvider } from "@/lib/store/providers/CurrencyProvider";
import CartDrawer from "@/components/CartDrawer";
import { AuthProvider } from "@/lib/store/providers/AuthProvider";
import { WishlistProvider } from "@/lib/store/providers/WishlistProvider";
import { getAuthUser } from "@/lib/auth/dal";
import { routing } from "@/i18n/routing";
import { ConsentProvider } from "@/lib/store/providers/ConsentProvider";
import { CookieBanner } from "@/components/cookies/CookieBanner";
import { getServerConsent } from "@/lib/helpers/consentCookie";
import { productService } from "@/lib/service/product";
import { SITE_URL } from "@/content/data";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/helpers/metadata";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

// Serif companion, used only for display quotes (see Quote.tsx)
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
});

// Metadane WSPÓLNE dla całej aplikacji — i zapas dla stron, które nie mają
// własnych (konto, logowanie, koszyk, 404). Podstrony widoczne w wyszukiwarce
// budują swoje przez `buildPageMetadata`, razem z `canonical` i hreflangiem.
//
// Bez `metadataBase` względny adres obrazka nie zamieniłby się w pełny link,
// a bez pełnego linku Facebook, Instagram czy komunikator nie pokażą podglądu.
// Opis i tekst alternatywny idą z tłumaczeń, więc polski link udostępniony
// znajomej wygląda po polsku.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_NAME,
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      title: SITE_NAME,
      description,
      images: [{ ...DEFAULT_OG_IMAGE, alt: t("ogAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

// Zegar odczytany w prerenderze musi siedzieć w zacache'owanej funkcji —
// inaczej Next nie wie, jak długo statyczna strona zachowuje ważność.
async function getBuildTime(): Promise<Date> {
  "use cache";
  cacheLife("max");
  return new Date();
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  // Keeps the locale available to components that get no params of their own —
  // not-found.tsx above all.
  setRequestLocale(locale);

  // Kategorie idą z cache'u („use cache" w serwisie produktów), więc czekanie
  // na nie NIE odbiera stronie statyczności. Pobrane raz, dla menu i stopki.
  const categories = await productService.getNavigationCategories();

  // Na sesję i zgodę layout świadomie NIE czeka. Obie siedzą w ciasteczkach,
  // czyli w danych żądania — a gdyby layout je odczytał, każda podstrona
  // musiałaby być liczona od nowa przy każdym wejściu. Zamiast wartości idą
  // więc dalej obietnice, a czeka na nie tylko ten fragment drzewa, który ich
  // używa (pasek cookies, link do konta), każdy we własnej granicy <Suspense>.
  const userPromise = getAuthUser();
  const consentPromise = getServerConsent();

  // next-intl, gdy czegoś nie dostanie wprost, dobiera to z żądania (nagłówek
  // z językiem) — a każdy taki odczyt odbiera stronie statyczność. Podajemy
  // więc komplet: język znamy z adresu, a wiadomości i strefę czasową bierzemy
  // Z JAWNYM językiem, dzięki czemu next-intl nie zagląda do nagłówków.
  const [messages, timeZone, buildTime, t] = await Promise.all([
    getMessages({ locale }),
    getTimeZone({ locale }),
    getBuildTime(),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  return (
    <html lang={locale} className={`${montserrat.variable} ${cormorant.variable}`}>
      <body className="bg-[var(--background)]">
        {/* `formats` i `now` też muszą być podane, bo inaczej next-intl idzie
            po nie do konfiguracji żądania. Własnych formatów nie mamy (stąd
            pusty obiekt), a `now` służy tylko formatowaniu w stylu „3 dni
            temu", czego nigdzie nie używamy — wystarczy chwila z budowania. */}
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={timeZone}
          formats={{}}
          now={buildTime}
        >
          <ConsentProvider serverConsent={consentPromise}>
            <AuthProvider userPromise={userPromise}>
              <WishlistProvider userPromise={userPromise}>
                <CurrencyProvider>
                  <CartProvider>
                    {/* Bez tego klawiatura musi przejść przez logo, menu,
                        rozwijane listy, przełączniki i trzy ikony — kilkanaście
                        przystanków — zanim dotrze do treści, i to na każdej
                        podstronie. Link jest niewidoczny, dopóki nie dostanie
                        fokusu.
                        ‼️ Warstwa MUSI być wyższa niż z-50 przyklejonego
                        nagłówka. Przy równej nagłówek wygrywa, bo stoi w kodzie
                        później — link był wtedy w pełni „widoczny" w pomiarach
                        i niewidoczny na ekranie. */}
                    <a
                      href="#main"
                      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:border focus:border-[var(--foreground)] focus:bg-[var(--background)] focus:px-4 focus:py-2 focus:text-xs focus:tracking-widest focus:uppercase focus:text-[var(--foreground)]"
                    >
                      {t("skipToContent")}
                    </a>
                    <Navbar categories={categories} />
                    <CartDrawer />
                    <main id="main" className="flex-1 w-full">{children}</main>
                    <Footer categories={categories} locale={locale} />
                    <CookieBanner />
                  </CartProvider>
                </CurrencyProvider>
              </WishlistProvider>
            </AuthProvider>
          </ConsentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
