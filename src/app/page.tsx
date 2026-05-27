import Link from "next/link";
import { HOMEPAGE_CATEGORIES } from "@/content/data";

export default function Home() {
  return (
    <>
      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
          Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {HOMEPAGE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/sklep/${cat.slug}`}
              className="group aspect-square bg-[var(--color-ceramic)] flex flex-col items-center justify-center gap-3 hover:bg-[var(--color-ceramic-hover)] transition-colors"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs tracking-widest uppercase text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="bg-white border-t border-[var(--border)] py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-6">
            About the studio
          </h2>
          <p className="text-lg font-light leading-relaxed text-[var(--muted)]">
            Every piece is made by hand, with care and attention to every detail.
            Functional ceramics that combine simplicity of form with the warmth of the material.
          </p>
        </div>
      </section>
    </>
  );
}
