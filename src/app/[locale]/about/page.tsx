import Image from "next/image";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { ABOUT } from "@/content/about";
import { AboutBlock } from "@/content/types";
import ReviewsSlider from "@/components/ReviewsSlider";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getFeaturedReviews } from "@/lib/helpers/reviews";

// Szerokość zdjęć zależy od tego, ile ich stoi w grupie. Pojedyncze (portret,
// znak na spodzie) zajmują całą kolumnę tekstu, para staje obok siebie,
// a większa grupa (etapy pracy) układa się w dwie kolumny — przy trzech
// kafelki wychodziły po 200 px i drobne szczegóły ginęły. Od 2026-10-02
// osiem zdjęć to oryginały od Magdy (1600 px), więc mają z czego się
// rozciągnąć. Para „pierwszych prac" to nadal pliki z dokumentu, ok. 600 px
// w boku — w dwóch kolumnach i tak nie wychodzą ponad 312 px.
const photoGroupLayout = (count: number) =>
  count === 1 ? "" : "grid grid-cols-2 gap-3";

// Podpowiedź dla przeglądarki, jakiej szerokości zdjęcie pobrać: kolumna
// tekstu ma najwyżej 624 px (max-w-2xl minus odstępy po bokach).
const photoSizes = (count: number) =>
  count === 1 ? "(max-width: 672px) 100vw, 624px" : "(max-width: 672px) 50vw, 312px";

const AboutBlocks = ({ blocks }: { blocks: AboutBlock[] }) =>
  blocks.map((block, index) => {
    if (block.type === "heading") {
      return (
        <h2
          key={`${block.type}-${index}`}
          className="text-xs tracking-[0.2em] uppercase text-[var(--foreground)] pt-4"
        >
          {block.text}
        </h2>
      );
    }

    if (block.type === "photos") {
      return (
        <div
          key={`${block.type}-${index}`}
          className={cn("py-2", photoGroupLayout(block.photos.length))}
        >
          {block.photos.map((photo) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes={photoSizes(block.photos.length)}
              // Samotne zdjęcie zachowuje własne proporcje — pierwszy portret
              // Magdy był pionowy i kadrowanie do kwadratu ucinało jej głowę.
              // W siatce równy kwadrat wygrywa z proporcjami, bo inaczej
              // wiersz rozjeżdża się o kilka pikseli.
              className={cn(
                "w-full rounded-sm",
                block.photos.length === 1 ? "h-auto" : "aspect-square object-cover",
              )}
            />
          ))}
        </div>
      );
    }

    return <p key={`${block.type}-${index}`}>{block.text}</p>;
  });

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
        <AboutBlocks blocks={about.blocks} />
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
