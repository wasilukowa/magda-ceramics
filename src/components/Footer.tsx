import Image from "next/image";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/content/data";
import { CategoryNavigationProps } from "@/contracts/shared";
import { getCategoryLabel } from "@/lib/helpers/category";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";

// Rok w stopce. Odczyt zegara w prerenderze musi być jawnie zacache'owany —
// inaczej Next nie wie, na jak długo statyczna strona zachowuje ważność.
// Z profilem „days" strona odświeża się raz na dobę, czyli najpóźniej
// pierwszego stycznia nad ranem stopka pokaże nowy rok.
async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// `locale` przychodzi propsem z layoutu, a nie z żądania: gdyby stopka pytała
// next-intl o język przez nagłówki, każda strona z nią (czyli każda) musiałaby
// być liczona przy każdym wejściu.
export default async function Footer({
  categories,
  locale,
}: CategoryNavigationProps & { locale: string }) {
  const [t, year] = await Promise.all([
    getTranslations({ locale }),
    getCurrentYear(),
  ]);

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--color-navbar)] text-[var(--foreground)]">
      <div className="max-w-[1200px] mx-auto px-8 py-16">

        {/* Main grid: logo left + columns right */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-12 md:gap-16">

          {/* Logo */}
          <div className="flex items-start">
            <Link href="/">
              <Image
                src="/magda_round_one.svg"
                alt="Magda Ceramics"
                width={120}
                height={120}
                className="w-28 h-28"
              />
            </Link>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">

            {/* Info */}
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--muted)] mb-5">
                {t("footer.info")}
              </p>
              <ul className="space-y-3 text-xs tracking-wide">
                <li>
                  <Link href="/about" className="hover:opacity-60 transition-opacity">
                    {t("footer.about")}
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="hover:opacity-60 transition-opacity">
                    {t("footer.reviews")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:opacity-60 transition-opacity">
                    {t("footer.contact")}
                  </Link>
                </li>
                <li>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-60 transition-opacity"
                  >
                    {INSTAGRAM_HANDLE}
                  </a>
                </li>
              </ul>
            </div>

            {/* Shop */}
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--muted)] mb-5">
                {t("footer.shop")}
              </p>
              <ul className="space-y-3 text-xs tracking-wide">
                <li>
                  <Link href="/shop" className="hover:opacity-60 transition-opacity">
                    {t("categories.all")}
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={{ pathname: "/shop/[category]", params: { category: cat.slug } }}
                      className="hover:opacity-60 transition-opacity"
                    >
                      {getCategoryLabel(t, cat)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--muted)] mb-5">
                {t("footer.legal")}
              </p>
              <ul className="space-y-3 text-xs tracking-wide">
                {/* Oba linki prowadziły dotąd do kotwic w regulaminie — klient
                    dostawał paragrafy zamiast odpowiedzi „ile i kiedy". Teraz
                    idą na osobną stronę, a zwroty od razu na swoją sekcję. */}
                <li>
                  <Link href="/shipping" className="hover:opacity-60 transition-opacity">
                    {t("footer.shipping")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: "/shipping", hash: "returns" }}
                    className="hover:opacity-60 transition-opacity"
                  >
                    {t("footer.returns")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:opacity-60 transition-opacity">
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:opacity-60 transition-opacity">
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:opacity-60 transition-opacity">
                    {t("footer.cookies")}
                  </Link>
                </li>
                <li>
                  <CookieSettingsButton />
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-widest uppercase opacity-60">
          <span>© {year} Magda Ceramics</span>
          <span>{t("footer.copyright")}</span>
        </div>

      </div>
    </footer>
  );
}
