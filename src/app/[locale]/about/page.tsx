import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { ABOUT } from "@/content/about";
import { StoryBlocks } from "@/components/StoryBlocks";
import ReviewsSlider from "@/components/ReviewsSlider";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getFeaturedReviews } from "@/lib/helpers/reviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return buildPageMetadata({
    locale,
    route: "/about",
    title: t("aboutTitle"),
    descriptionKey: "pages.about",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const about = ABOUT[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];
  const [t, tReviews] = await Promise.all([
    getTranslations({ locale, namespace: "footer" }),
    getTranslations({ locale, namespace: "reviews" }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("aboutTitle")}
      </h1>
      {/* Tekst i zdjęcia siedzą w content/about.ts, dokładnie w tej
          kolejności, w której ustawiła je Magda w swoim dokumencie —
          poprawka w jej opowieści nie wymaga dotykania tego pliku. */}
      <div className="prose prose-sm max-w-none text-[var(--muted)] leading-relaxed space-y-5">
        <StoryBlocks blocks={about.blocks} />
        {/* Podpis Magdy jest dwuwierszowy („Ciepło pozdrawiam," i niżej
            „Magda"), więc łamanie z treści musi zostać zachowane. */}
        <p className="font-medium text-[var(--foreground)] whitespace-pre-line">
          {about.signature}
        </p>
      </div>

      {/* Opinie stoją zaraz pod opisem Magdy, a nie w osobnej pozycji menu —
          w stopce jest do nich link z kotwicą. Odstęp od góry taki jak przy
          zdjęciach; `scroll-mt` odsuwa nagłówek spod przyklejonego paska,
          dokładnie jak kotwice w regulaminie. */}
      <section id="reviews" className="mt-20 scroll-mt-40 md:scroll-mt-52">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-10 text-center">
          {tReviews("title")}
        </h2>
        <ReviewsSlider reviews={getFeaturedReviews()} />
      </section>
    </div>
  );
}
