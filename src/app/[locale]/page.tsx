import React from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HOMEPAGE_CATEGORIES } from "@/content/data";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  kubki: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10h16v14a3 3 0 01-3 3H11a3 3 0 01-3-3V10z"/>
      <path d="M24 14h2.5a3.5 3.5 0 010 7H24"/>
      <path d="M12 10V8"/>
      <path d="M18 10V8"/>
    </svg>
  ),
  miski: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 15h24"/>
      <path d="M6 15a12 12 0 0024 0"/>
      <path d="M13 27h10"/>
    </svg>
  ),
  maluszki: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 28v-9"/>
      <path d="M18 19c0-5-4-9-9-9 0 5 4 9 9 9z"/>
      <path d="M18 19c0-5 4-9 9-9 0 5-4 9-9 9z"/>
      <path d="M15 28h6"/>
    </svg>
  ),
  wazony: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 7h8"/>
      <path d="M14 7c-1 3-4 6-4 11a8 8 0 0016 0c0-5-3-8-4-11"/>
      <path d="M13 29h10"/>
    </svg>
  ),
  roznosci: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="13" r="2.5"/>
      <circle cx="23" cy="13" r="2.5"/>
      <circle cx="13" cy="23" r="2.5"/>
      <circle cx="23" cy="23" r="2.5"/>
    </svg>
  ),
};

export default async function Home() {
  const t = await getTranslations();

  return (
    <>
      {/* Hero */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8">
        <section className="bg-[var(--color-accent)] flex flex-col md:flex-row md:min-h-[580px]">
          <div className="md:w-[42%] flex-shrink-0 flex p-6 min-h-[300px] md:min-h-0">
            <div className="relative flex-1">
              <Image
                src="/coming-soon.jpg"
                alt="Magda Ceramics"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
          <div className="flex-1 flex items-center px-10 md:px-14 py-12">
            <div>
              <h1 className="text-2xl font-light tracking-wide mb-5">
                {t("home.heroTitle")}
              </h1>
              <p className="text-sm leading-relaxed mb-10">
                {t("home.heroText")}
              </p>
              <Link
                href="/about"
                className="inline-block border border-current px-7 py-3 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
              >
                {t("home.heroLink")}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Categories */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-20">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
          {t("home.categories")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {HOMEPAGE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={{ pathname: "/shop/[category]", params: { category: cat.slug } }}
              className="group aspect-square border-2 border-[var(--color-accent)] flex flex-col items-center justify-center gap-3 hover:bg-[var(--color-accent)]/10 transition-colors"
            >
              <span className="text-[var(--color-accent)] transition-colors">
                {CATEGORY_ICONS[cat.slug]}
              </span>
              <span className="text-xs tracking-widest uppercase text-[var(--foreground)] transition-colors">
                {t(`categories.${cat.slug}`)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
