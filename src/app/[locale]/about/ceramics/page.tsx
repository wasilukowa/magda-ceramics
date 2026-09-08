import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { CERAMICS, CERAMICS_DRAFT } from "@/content/ceramics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ceramics" });
  return buildPageMetadata({
    locale,
    route: "/about/ceramics",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function CeramicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const content =
    CERAMICS[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];
  const t = await getTranslations({ locale, namespace: "ceramics" });

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("title")}
      </h1>

      {/* Notka znika sama, gdy Magda ustawi CERAMICS_DRAFT na false — patrz
          content/ceramics.ts. Lepiej powiedzieć wprost, że tekst jest w
          przygotowaniu, niż wypuścić cudze zdania pod jej nazwiskiem. */}
      {CERAMICS_DRAFT && (
        <p className="mb-12 border border-[var(--border)] px-5 py-4 text-center text-xs italic text-[var(--muted)]">
          {t("draftNote")}
        </p>
      )}

      <p className="text-[var(--muted)] leading-relaxed">{content.intro}</p>

      {/* Numer kroku stoi w warstwie ozdobnej (aria-hidden), a kolejność niesie
          sama lista — czytnik ekranu powie „1 z 7" bez naszej pomocy. */}
      <ol className="mt-16 flex flex-col gap-14">
        {content.steps.map((step, index) => (
          <li key={step.heading} className="flex flex-col gap-3">
            <span
              aria-hidden
              className="text-[10px] tracking-[0.3em] text-[var(--color-accent)]"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-sm tracking-widest uppercase">{step.heading}</h2>
            {step.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[var(--muted)] leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </li>
        ))}
      </ol>

      <p className="mt-16 border-t border-[var(--border)] pt-10 leading-relaxed">
        {content.closing}
      </p>
    </div>
  );
}
