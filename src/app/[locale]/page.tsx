import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HOMEPAGE_CATEGORIES } from "@/content/data";

export default async function Home() {
  const t = await getTranslations();

  return (
    <>
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-light tracking-wide mb-4">
          {t("home.heroTitle")}
        </h1>
        <p className="text-[var(--muted)] leading-relaxed mb-6">
          {t("home.heroText")}
        </p>
        <Link
          href="/about"
          className="text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
        >
          {t("home.heroLink")}
        </Link>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
          {t("home.categories")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {HOMEPAGE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={{ pathname: "/shop/[category]", params: { category: cat.slug } }}
              className="group aspect-square bg-[var(--color-ceramic)] flex flex-col items-center justify-center gap-3 hover:bg-[var(--color-ceramic-hover)] transition-colors"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs tracking-widest uppercase text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                {t(`categories.${cat.slug}`)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
