import Link from "next/link";
import Image from "next/image";
import { NAV_LINKS, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/content/data";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-navbar)] text-[var(--foreground)]">
      <div className="max-w-[1200px] mx-auto px-8 pt-14 pb-10 flex flex-col items-center gap-10">

        {/* Logo */}
        <Link href="/">
          <Image src="/logo.svg" alt="Magda Ceramics" width={220} height={85} className="h-12 w-auto" />
        </Link>

        {/* Nav links */}
        <nav className="flex flex-wrap justify-center gap-8 text-xs tracking-widest uppercase">
          {NAV_LINKS.map((link) => (
            <Link key={link.url} href={link.url} className="hover:opacity-60 transition-opacity">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Instagram */}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          {INSTAGRAM_HANDLE}
        </a>

        {/* Divider */}
        <div className="w-full border-t border-[var(--color-navbar-border)]" />

        {/* Copyright */}
        <p className="text-xs tracking-widest uppercase opacity-70">
          © {new Date().getFullYear()} Magda Ceramics — Handmade ceramics
        </p>

      </div>
    </footer>
  );
}
