import type { Metadata } from "next";
import Image from "next/image";
import { COMING_SOON_META, SITE_URL } from "@/content/data";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/helpers/metadata";

// Zaślepka stoi poza [locale], więc nie dziedziczy metadanych z layoutu sklepu
// — bez tego karta przeglądarki pokazywała sam adres, a link wklejony w
// komunikator nie miał ani opisu, ani zdjęcia. `metadataBase` jest potrzebne,
// żeby obrazek podglądu zamienił się w pełny adres.
//
// Zdjęcie jest w dwóch wersjach (telefon i komputer), a widać zawsze jedną —
// dlatego `loading="eager"`, a nie `preload`: dokumentacja Next odradza
// preload, gdy to, które zdjęcie jest największym elementem, zależy od okna.
const title = `${SITE_NAME} — ${COMING_SOON_META.title}`;
const { description, imageAlt } = COMING_SOON_META;
const images = [{ ...DEFAULT_OG_IMAGE, alt: imageAlt }];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    title,
    description,
    images,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_OG_IMAGE.url],
  },
};

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-4 h-4 flex-shrink-0"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TextContent() {
  return (
    <>
      <Image
        src="/logo.svg"
        alt="Magda Ceramics"
        width={360}
        height={140}
        className="mb-10 w-64 sm:w-80 min-[1100px]:w-96 h-auto"
      />

      <p className="text-sm min-[1100px]:text-base tracking-[0.3em] uppercase text-[var(--foreground)] mb-4">
        Currently in the kiln
      </p>
      <p className="text-sm min-[1100px]:text-base tracking-[0.3em] uppercase text-[var(--foreground)] mb-12">
        Shop coming soon
      </p>

      <p className="text-sm min-[1100px]:text-base text-[var(--foreground)] mb-2">
        Join me on my instagram:
      </p>
      <a
        href="https://www.instagram.com/magda_ceramics"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm min-[1100px]:text-base text-[var(--foreground)] underline underline-offset-4 hover:opacity-60 transition-opacity"
      >
        <InstagramIcon />
        magda_ceramics
      </a>
    </>
  );
}

export default function ComingSoon() {
  return (
    <section className="fixed inset-0 z-[9999] overflow-hidden">

      {/* Mobile / tablet (< 1100px): pełnoekranowe zdjęcie z nakładką tekstową */}
      <div className="min-[1100px]:hidden relative w-full h-full">
        <div className="absolute inset-0 p-[20px] bg-[var(--color-accent)]">
          <div className="relative w-full h-full">
            <Image
              src="/coming-soon.jpg"
              alt={COMING_SOON_META.photoAlt}
              fill
              sizes="100vw"
              className="object-cover object-center"
              loading="eager"
            />
          </div>
        </div>

        {/* Nakładka tekstowa — wyśrodkowana na zdjęciu */}
        <div className="absolute inset-[20px] flex items-center justify-center">
          <div className="w-full bg-white/70 flex flex-col items-center px-8 py-8 text-center">
            <TextContent />
          </div>
        </div>
      </div>

      {/* Desktop (≥ 1100px): dwie kolumny */}
      <div className="hidden min-[1100px]:grid min-[1100px]:grid-cols-2 h-full">
        <div className="relative p-[20px] bg-[var(--color-accent)]">
          <div className="relative w-full h-full">
            <Image
              src="/coming-soon.jpg"
              alt={COMING_SOON_META.photoAlt}
              fill
              sizes="50vw"
              className="object-cover object-center"
              loading="eager"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-[var(--color-accent)] px-10 py-10 text-center">
          <TextContent />
        </div>
      </div>

    </section>
  );
}
