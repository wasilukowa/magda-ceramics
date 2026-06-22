import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/store/providers/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import { AuthProvider } from "@/lib/store/providers/AuthProvider";
import { WishlistProvider } from "@/lib/store/providers/WishlistProvider";
import { getSession } from "@/lib/auth/dal";
import { routing } from "@/i18n/routing";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
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

  const session = await getSession();
  const authUser = session
    ? { id: session.customerId, email: session.email }
    : null;

  return (
    <html lang={locale} className={montserrat.variable}>
      <body className="bg-[var(--background)]">
        <NextIntlClientProvider>
          <AuthProvider user={authUser}>
            <WishlistProvider
              key={session ? "auth" : "guest"}
              isAuthenticated={Boolean(session)}
            >
              <CartProvider>
                <Navbar />
                <CartDrawer />
                <main className="flex-1 w-full">{children}</main>
                <Footer />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
