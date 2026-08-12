import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
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
import { getSession } from "@/lib/auth/dal";
import { routing } from "@/i18n/routing";
import { ConsentProvider } from "@/lib/store/providers/ConsentProvider";
import { CookieBanner } from "@/components/cookies/CookieBanner";
import { CONSENT_COOKIE_NAME, parseConsentCookie } from "@/lib/helpers/consent";
import { cookies } from "next/headers";

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

  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);
  const authUser = session
    ? { id: session.customerId, email: session.email }
    : null;

  // Read on the server so the banner never flashes for a returning customer.
  const initialConsent = parseConsentCookie(
    cookieStore.get(CONSENT_COOKIE_NAME)?.value,
  );

  return (
    <html lang={locale} className={`${montserrat.variable} ${cormorant.variable}`}>
      <body className="bg-[var(--background)]">
        <NextIntlClientProvider>
          <ConsentProvider initialConsent={initialConsent}>
            <AuthProvider user={authUser}>
              <WishlistProvider
                key={session ? "auth" : "guest"}
                isAuthenticated={Boolean(session)}
              >
                <CurrencyProvider>
                  <CartProvider>
                    <Navbar />
                    <CartDrawer />
                    <main className="flex-1 w-full">{children}</main>
                    <Footer />
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
