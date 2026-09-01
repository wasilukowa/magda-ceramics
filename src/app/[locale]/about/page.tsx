import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ABOUT_PHOTOS } from "@/content/data";
import { ABOUT } from "@/content/about";
import ReviewsSlider from "@/components/ReviewsSlider";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getFeaturedReviews } from "@/lib/helpers/reviews";

const photos = ABOUT_PHOTOS.map((src, index) => ({
  src,
  alt: `Magda ceramics ${index + 1}`,
}));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return { title: `${t("aboutTitle")} — Magda Ceramics` };
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
      {/* Tekst siedzi w content/about.ts — poprawka w opowieści Magdy nie
          wymaga dotykania tego pliku. */}
      <div className="prose prose-sm max-w-none text-[var(--muted)] leading-relaxed space-y-5">
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p className="font-medium text-[var(--foreground)]">{about.signature}</p>
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

      <div className="mt-20 flex flex-col gap-6">
        {photos.map((photo) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={800}
            height={600}
            className="w-full object-cover rounded-sm"
          />
        ))}
      </div>
    </div>
  );
}
