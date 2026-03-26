"use client";

import Link from "next/link";
import { useState } from "react";

const SHOP_CATEGORIES = [
  { name: "Kubki", slug: "kubki" },
  { name: "Miski", slug: "miski" },
  { name: "Maluszki", slug: "maluszki" },
  { name: "Wazony", slug: "wazony" },
  { name: "Różności", slug: "roznosci" },
];

export default function Navbar() {
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-sm font-semibold tracking-widest uppercase">
          Magda Ceramics
        </Link>

        {/* Desktop menu */}
        <ul className="hidden md:flex items-center gap-8 text-xs tracking-widest uppercase text-[var(--muted)]">
          <li>
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Strona główna
            </Link>
          </li>

          {/* Sklep dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors cursor-pointer">
              Sklep
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {shopOpen && (
              <ul className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[var(--background)] border border-[var(--border)] min-w-[140px] shadow-sm">
                <li>
                  <Link
                    href="/sklep"
                    className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[#e8e0d5] transition-colors"
                  >
                    Wszystkie
                  </Link>
                </li>
                {SHOP_CATEGORIES.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/sklep/${cat.slug}`}
                      className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[#e8e0d5] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li>
            <Link href="/kontakt" className="hover:text-[var(--foreground)] transition-colors">
              Kontakt
            </Link>
          </li>
        </ul>

        {/* Ikony */}
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/magda-ceramics"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>

          {/* Hamburger mobile */}
          <button
            className="md:hidden text-[var(--muted)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)] px-6 py-4">
          <ul className="flex flex-col gap-4 text-xs tracking-widest uppercase text-[var(--muted)]">
            <li><Link href="/" onClick={() => setMobileOpen(false)}>Strona główna</Link></li>
            <li><Link href="/sklep" onClick={() => setMobileOpen(false)}>Sklep — wszystkie</Link></li>
            {SHOP_CATEGORIES.map((cat) => (
              <li key={cat.slug} className="pl-4">
                <Link href={`/sklep/${cat.slug}`} onClick={() => setMobileOpen(false)}>
                  {cat.name}
                </Link>
              </li>
            ))}
            <li><Link href="/kontakt" onClick={() => setMobileOpen(false)}>Kontakt</Link></li>
          </ul>
        </div>
      )}
    </header>
  );
}
