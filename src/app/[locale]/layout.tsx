import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTimeZone, setRequestLocale } from "next-intl/server";
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

export const metadata: Metadata = {
  title: "Magda Ceramics",
  description: "Handmade functional ceramics",
};

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
  const [messages, timeZone, buildTime] = await Promise.all([
    getMessages({ locale }),
    getTimeZone({ locale }),
    getBuildTime(),
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
                    <Navbar categories={categories} />
                    <CartDrawer />
                    <main className="flex-1 w-full">{children}</main>
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
