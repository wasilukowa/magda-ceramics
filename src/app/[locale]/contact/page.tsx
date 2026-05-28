import { getTranslations } from "next-intl/server";
import { INSTAGRAM_URL } from "@/content/data";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return { title: `${t("title")} — Magda Ceramics` };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("title")}
      </h1>

      <form className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-widest uppercase text-[var(--muted)]">
            {t("name")}
          </label>
          <input
            type="text"
            className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-widest uppercase text-[var(--muted)]">
            {t("email")}
          </label>
          <input
            type="email"
            className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-widest uppercase text-[var(--muted)]">
            {t("message")}
          </label>
          <textarea
            rows={6}
            className="border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors resize-none"
          />
        </div>
        <button
          type="submit"
          className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors self-start"
        >
          {t("send")}
        </button>
      </form>

      <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-col gap-3 text-sm text-[var(--muted)]">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--foreground)] transition-colors"
        >
          Instagram: @magda_ceramics
        </a>
      </div>
    </div>
  );
}
