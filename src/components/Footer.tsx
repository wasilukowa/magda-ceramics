import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#a4b6b8] text-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto px-8 pt-14 pb-10 flex flex-col items-center gap-10">

        {/* Logo */}
        <Link href="/">
          <Image src="/logo.svg" alt="Magda Ceramics" width={220} height={85} className="h-12 w-auto" />
        </Link>

        {/* Nav links */}
        <nav className="flex flex-wrap justify-center gap-8 text-xs tracking-widest uppercase">
          <Link href="/" className="hover:opacity-60 transition-opacity">Home</Link>
          <Link href="/sklep" className="hover:opacity-60 transition-opacity">Shop</Link>
          <Link href="/kontakt" className="hover:opacity-60 transition-opacity">Contact</Link>
        </nav>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/magda_ceramics"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          @magda_ceramics
        </a>

        {/* Divider */}
        <div className="w-full border-t border-[#8a9e9f]" />

        {/* Copyright */}
        <p className="text-xs tracking-widest uppercase opacity-70">
          © {new Date().getFullYear()} Magda Ceramics — Handmade ceramics
        </p>

      </div>
    </footer>
  );
}
