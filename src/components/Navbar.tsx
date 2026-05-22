"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const SHOP_CATEGORIES = [
  { name: "Mugs", slug: "kubki" },
  { name: "Bowls", slug: "miski" },
  { name: "Smalls", slug: "maluszki" },
  { name: "Vases", slug: "wazony" },
  { name: "Miscellaneous", slug: "roznosci" },
];

export default function Navbar() {
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-[#a4b6b8]">

      {/* Logo row */}
      <div className="max-w-[1200px] mx-auto flex justify-center pt-8 pb-6">
        <Link href="/">
          <Image src="/logo.svg" alt="Magda Ceramics" width={300} height={116} className="h-20 w-auto" />
        </Link>
      </div>

      {/* Nav row */}
      <div className="max-w-[1200px] mx-auto relative flex items-center justify-center pb-6 px-6">

        {/* Desktop nav links — centered */}
        <ul className="hidden md:flex items-center gap-10 text-sm tracking-widest uppercase text-[#1a1a1a]">
          <li>
            <Link href="/" className="hover:opacity-60 transition-opacity">
              Home
            </Link>
          </li>

          <li
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <Link href="/sklep" className="flex items-center gap-1.5 hover:opacity-60 transition-opacity">
              Shop
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </Link>

            {shopOpen && (
              <ul className="absolute top-full left-1/2 -translate-x-1/2 bg-[#a4b6b8] border border-[#8a9e9f] min-w-[160px] shadow-sm">
                <li>
                  <Link href="/sklep" className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[#8AAAA6] transition-colors">
                    All
                  </Link>
                </li>
                {SHOP_CATEGORIES.map((cat) => (
                  <li key={cat.slug}>
                    <Link href={`/sklep/${cat.slug}`} className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[#8AAAA6] transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li>
            <Link href="/kontakt" className="hover:opacity-60 transition-opacity">
              Contact
            </Link>
          </li>

          <li>
            <a
              href="https://www.instagram.com/magda_ceramics"
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

        {/* Icons — absolute right, always inside container */}
        <div className="absolute right-6 flex items-center gap-5 text-[#1a1a1a]">
          <button aria-label="Account" className="hidden md:block hover:opacity-60 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>

          <button onClick={openCart} aria-label="Cart" className="relative hover:opacity-60 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#1a1a1a] text-[#a4b6b8] text-[9px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
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
        <div className="md:hidden border-t border-[#8a9e9f] bg-[#a4b6b8]">
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <ul className="flex flex-col gap-5 text-sm tracking-widest uppercase text-[#1a1a1a]">
            <li><Link href="/" onClick={() => setMobileOpen(false)}>Home</Link></li>
            <li><Link href="/sklep" onClick={() => setMobileOpen(false)}>Shop — all</Link></li>
            {SHOP_CATEGORIES.map((cat) => (
              <li key={cat.slug} className="pl-4">
                <Link href={`/sklep/${cat.slug}`} onClick={() => setMobileOpen(false)}>{cat.name}</Link>
              </li>
            ))}
            <li><Link href="/kontakt" onClick={() => setMobileOpen(false)}>Contact</Link></li>
            <li>
              <a href="https://www.instagram.com/magda_ceramics" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
                Instagram
              </a>
            </li>
          </ul>
        </div>
        </div>
      )}
    </header>
  );
}
