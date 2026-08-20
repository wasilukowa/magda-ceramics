"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/hooks/useCart";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/lib/store/providers/AuthProvider";
import { INSTAGRAM_URL } from "@/content/data";
import { CategoryNavigationProps } from "@/contracts/shared";
import { getCategoryLabel } from "@/lib/helpers/category";
import { cn } from "@/lib/utils";

// Po ilu pikselach przewinięcia nagłówek się zwija.
const SHRINK_AT = 24;

export default function Navbar({ categories }: CategoryNavigationProps) {
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const user = useAuth();
  const accountHref = user ? "/account" : "/login";
  const t = useTranslations();

  // Nagłówek zajmował na stałe ~150 px, czyli jedną piątą ekranu telefonu.
  // Po przewinięciu logo i odstępy schodzą do mniejszego rozmiaru, a pasek
  // zostaje. Nasłuch jest pasywny, a stan zmienia się tylko przy przejściu
  // przez próg — nie przy każdym pikselu przewijania.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = window.scrollY > SHRINK_AT;
      setScrolled((prev) => (prev === next ? prev : next));
    };

    // Strona mogła zostać otwarta już przewinięta (odświeżenie, powrót wstecz).
    const initial = requestAnimationFrame(sync);
    window.addEventListener("scroll", sync, { passive: true });

    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener("scroll", sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-navbar)]">

      {/* Logo row */}
      {/* The logo is 5.17:1, so h-20 alone measures 414px — wider than a 390px
          phone. Height steps up with the viewport, and px-6 plus max-w-full
          keep it inside the screen whatever the device. */}
      <div
        className={cn(
          "max-w-[1200px] mx-auto flex justify-center px-6 motion-safe:transition-all motion-safe:duration-300",
          scrolled ? "pt-3 pb-2" : "pt-8 pb-6"
        )}
      >
        <Link href="/" className="block max-w-full">
          <Image
            src="/logo.svg"
            alt="Magda Ceramics"
            width={501}
            height={97}
            className={cn(
              "w-auto max-w-full object-contain motion-safe:transition-all motion-safe:duration-300",
              scrolled ? "h-8 md:h-10" : "h-12 sm:h-16 md:h-20"
            )}
          />
        </Link>
      </div>

      {/* Nav row. The icons used to sit in an absolutely positioned box, so
          they reserved no space and simply lay on top of the centred menu —
          around 768px "KONTAKT" ran into the PLN/EN switchers. Now the row is
          three flex columns: a spacer, the menu, the icons. The menu stays
          centred while there is room and slides left instead of colliding when
          there is not. */}
      <div
        className={cn(
          "max-w-[1200px] mx-auto flex items-center gap-4 px-6 motion-safe:transition-all motion-safe:duration-300",
          scrolled ? "pb-3" : "pb-6"
        )}
      >

        <div className="flex-1 min-w-0" aria-hidden="true" />

        {/* Desktop nav — centered */}
        <ul className="hidden md:flex shrink-0 items-center gap-6 lg:gap-10 text-sm tracking-widest uppercase text-[var(--foreground)]">
          <li>
            <Link href="/" className="hover:opacity-60 transition-opacity">
              {t("nav.home")}
            </Link>
          </li>

          <li>
            <Link href="/about" className="hover:opacity-60 transition-opacity">
              {t("nav.about")}
            </Link>
          </li>

          <li
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <Link href="/shop" className="flex items-center gap-1.5 hover:opacity-60 transition-opacity">
              {t("nav.shop")}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </Link>

            {shopOpen && (
              <ul className="absolute top-full left-1/2 -translate-x-1/2 bg-[var(--color-navbar)] border border-[var(--color-navbar-border)] min-w-[160px] shadow-sm">
                <li>
                  <Link href="/shop" className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[var(--color-navbar-hover)] transition-colors">
                    {t("categories.all")}
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link href={{ pathname: "/shop/[category]", params: { category: cat.slug } }} className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[var(--color-navbar-hover)] transition-colors">
                      {getCategoryLabel(t, cat)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li>
            <Link href="/contact" className="hover:opacity-60 transition-opacity">
              {t("nav.contact")}
            </Link>
          </li>

          <li>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center hover:opacity-60 transition-opacity"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </li>
        </ul>

        {/* Right icons */}
        <div className="flex-1 flex items-center justify-end gap-4 lg:gap-5 text-[var(--foreground)]">
          <CurrencySwitcher className="hidden md:flex" />

          <LanguageSwitcher className="hidden md:flex" />

          <Link
            href={accountHref}
            aria-label={user ? t("nav.account") : t("nav.login")}
            className="hidden md:block hover:opacity-60 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>

          <Link href="/wishlist" aria-label={t("nav.wishlist")} className="relative hover:opacity-60 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--foreground)] text-[var(--color-navbar)] text-[9px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>

          <button onClick={openCart} aria-label="Cart" className="relative hover:opacity-60 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--foreground)] text-[var(--color-navbar)] text-[9px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          <button
            className="md:hidden hover:opacity-60 transition-opacity"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-navbar-border)] bg-[var(--color-navbar)]">
          <div className="max-w-[1200px] mx-auto px-6 py-5">
            <ul className="flex flex-col gap-5 text-sm tracking-widest uppercase text-[var(--foreground)]">
              <li><Link href="/" onClick={() => setMobileOpen(false)}>{t("nav.home")}</Link></li>
              <li><Link href="/about" onClick={() => setMobileOpen(false)}>{t("nav.about")}</Link></li>
              <li><Link href="/shop" onClick={() => setMobileOpen(false)}>{t("nav.shop")} — {t("categories.all")}</Link></li>
              {categories.map((cat) => (
                <li key={cat.slug} className="pl-4">
                  <Link href={{ pathname: "/shop/[category]", params: { category: cat.slug } }} onClick={() => setMobileOpen(false)}>
                    {getCategoryLabel(t, cat)}
                  </Link>
                </li>
              ))}
              <li><Link href="/contact" onClick={() => setMobileOpen(false)}>{t("nav.contact")}</Link></li>
              <li>
                <Link href="/wishlist" onClick={() => setMobileOpen(false)}>
                  {t("nav.wishlist")}
                  {wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                </Link>
              </li>
              <li>
                <Link href={accountHref} onClick={() => setMobileOpen(false)}>
                  {user ? t("nav.account") : t("nav.login")}
                </Link>
              </li>
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
                  Instagram
                </a>
              </li>
              {/* Ustawienia jako osobna grupa: wcześniej język i waluta stały
                  w jednym ciągu z linkami nawigacji, w innej typografii, i
                  wyglądały jak doklejone. */}
              <li className="mt-2 pt-5 border-t border-[var(--color-navbar-border)] flex flex-col gap-4">
                <span className="flex items-center justify-between gap-4">
                  <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
                    {t("nav.language")}
                  </span>
                  <LanguageSwitcher />
                </span>
                <span className="flex items-center justify-between gap-4">
                  <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
                    {t("nav.currency")}
                  </span>
                  <CurrencySwitcher />
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
