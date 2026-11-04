import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { routing } from "@/i18n/routing";
import { CERAMICS } from "@/content/ceramics";
import { StoryBlocks } from "@/components/StoryBlocks";

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
  const ceramics = CERAMICS[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];
  const t = await getTranslations({ locale, namespace: "ceramics" });

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("title")}
      </h1>
      {/* Tytuł z dokumentu Magdy stoi nad tekstem większą czcionką, tak jak
          nagłówek na stronie głównej. */}
      <h2 className="text-2xl font-light tracking-wide leading-snug text-center text-[var(--foreground)] mb-12">
        {ceramics.title}
      </h2>
      {/* Tekst i zdjęcia siedzą w content/ceramics.ts, w kolejności z jej
          dokumentu — ten sam układ co na „O mnie". */}
      <div className="prose prose-sm max-w-none text-[var(--muted)] leading-relaxed space-y-5">
        <StoryBlocks blocks={ceramics.blocks} />
        <p className="font-medium text-[var(--foreground)] whitespace-pre-line">
          {ceramics.signature}
        </p>
      </div>
    </div>
  );
}
