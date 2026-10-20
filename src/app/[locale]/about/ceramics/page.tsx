import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { CERAMICS_PHOTOS } from "@/content/ceramics";
import { PhotoSlider } from "@/components/PhotoSlider";

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
  const t = await getTranslations({ locale, namespace: "ceramics" });

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("title")}
      </h1>

      {/* Zdjęcia są kwadratowe (dwa pionowe), więc kwadratowa ramka pokazuje
          je prawie bez przycinania. Kolumna ma 624 px treści. */}
      <div className="aspect-square mb-12">
        <PhotoSlider
          photos={CERAMICS_PHOTOS.map((src, i) => ({
            src,
            alt: t("photoAlt", { number: i + 1 }),
          }))}
          sizes="(max-width: 672px) 100vw, 624px"
        />
      </div>

      {/* Tekstu na razie nie ma (decyzja Natalii 2026-10-20) — w ramce zostaje
          tylko napis w duchu zaślepki sklepu („Currently in the kiln"). */}
      <div className="border border-[var(--border)] px-5 py-10 text-center text-sm tracking-[0.3em] uppercase">
        <p className="mb-4">{t("kiln")}</p>
        <p>{t("comingSoon")}</p>
      </div>
    </div>
  );
}
