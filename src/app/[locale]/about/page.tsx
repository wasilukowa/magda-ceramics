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

// Zdjęcia Magdy z dokumentu „O mnie" są niewielkie (ok. 450 px w boku), bo
// Pages pomniejsza to, co się do niego wklei. Dlatego grupa decyduje o
// szerokości: pojedyncze zdjęcie nie rozciąga się na całą kolumnę tekstu,
// dwa stają obok siebie, a większa grupa układa się w siatkę. Nikt nie ogląda
// tu zdjęcia większego, niż na to pozwala plik.
const photoGroupLayout = (count: number) => {
  if (count === 1) return "max-w-xs mx-auto";
  if (count === 2) return "grid grid-cols-2 gap-3";
  return "grid grid-cols-2 gap-3 sm:grid-cols-3";
};

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
              sizes="(max-width: 640px) 50vw, 320px"
              // Samotne zdjęcie zachowuje własne proporcje — portret Magdy
              // jest pionowy i kadrowanie go do kwadratu ucinało jej głowę.
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
