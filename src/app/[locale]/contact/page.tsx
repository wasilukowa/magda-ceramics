import { getTranslations } from "next-intl/server";
import { INSTAGRAM_URL } from "@/content/data";
import ContactForm from "@/components/ContactForm";

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

      <ContactForm />

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
