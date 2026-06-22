"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/lib/store/providers/AuthProvider";
import { SHOP_CATEGORIES, INSTAGRAM_URL } from "@/content/data";

export default function Navbar() {
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const user = useAuth();
  const accountHref = user ? "/account" : "/login";
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  function switchLocale() {
    const next = locale === "en" ? "pl" : "en";
    // @ts-expect-error -- pathname and params always match the current route
    router.replace({ pathname, params }, { locale: next });
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-navbar)]">

      {/* Logo row */}
      <div className="max-w-[1200px] mx-auto flex justify-center pt-8 pb-6">
        <Link href="/">
          <Image src="/logo.svg" alt="Magda Ceramics" width={300} height={116} className="h-20 w-auto" />
        </Link>
      </div>

      {/* Nav row */}
      <div className="max-w-[1200px] mx-auto relative flex items-center justify-center pb-6 px-6">

        {/* Desktop nav — centered */}
        <ul className="hidden md:flex items-center gap-10 text-sm tracking-widest uppercase text-[var(--foreground)]">
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
                {SHOP_CATEGORIES.map((cat) => (
                  <li key={cat.slug}>
                    <Link href={{ pathname: "/shop/[category]", params: { category: cat.slug } }} className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[var(--color-navbar-hover)] transition-colors">
                      {t(`categories.${cat.slug}`)}
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
        <div className="absolute right-6 flex items-center gap-5 text-[var(--foreground)]">
          {/* Language switcher */}
          <button
            onClick={switchLocale}
            className="hidden md:block text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
            aria-label="Switch language"
          >
            {locale === "en" ? "PL" : "EN"}
          </button>

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
              {SHOP_CATEGORIES.map((cat) => (
                <li key={cat.slug} className="pl-4">
                  <Link href={{ pathname: "/shop/[category]", params: { category: cat.slug } }} onClick={() => setMobileOpen(false)}>
                    {t(`categories.${cat.slug}`)}
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
              <li>
                <button onClick={switchLocale} className="text-left hover:opacity-60 transition-opacity">
                  {locale === "en" ? "Polski" : "English"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
