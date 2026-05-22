import Link from "next/link";

const categories = [
  { name: "Mugs", slug: "kubki", emoji: "☕" },
  { name: "Bowls", slug: "miski", emoji: "🥣" },
  { name: "Smalls", slug: "maluszki", emoji: "🌿" },
  { name: "Vases", slug: "wazony", emoji: "🏺" },
  { name: "Miscellaneous", slug: "roznosci", emoji: "✨" },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[85vh] bg-[#e8e0d5] flex items-center justify-center overflow-hidden">
        <div className="text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
            Handmade ceramics
          </p>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-[var(--foreground)]">
            Magda Ceramics
          </h1>
          <div className="mt-8">
            <Link
              href="/sklep"
              className="inline-block text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
            >
              View collection
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
          Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/sklep/${cat.slug}`}
              className="group aspect-square bg-[#e8e0d5] flex flex-col items-center justify-center gap-3 hover:bg-[#ddd5c8] transition-colors"
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
