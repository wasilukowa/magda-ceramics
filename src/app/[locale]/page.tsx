import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { Link } from "@/i18n/navigation";
import { productService } from "@/lib/service/product";
import { getCategoryLabel } from "@/lib/helpers/category";
import { PhotoSlider } from "@/components/PhotoSlider";
import CategoryTile from "@/components/CategoryTile";
import { HERO_SLIDER_PHOTOS } from "@/content/data";
import { FeaturedWorks } from "@/components/FeaturedWorks";
import { Quote } from "@/components/Quote";
import WishlistCarousel from "@/components/WishlistCarousel";
import ReviewsSlider from "@/components/ReviewsSlider";
import { getFeaturedReviews } from "@/lib/helpers/reviews";
import { ButtonArrow, buttonClass } from "@/components/ui/button";

// Kafelek kategorii: pół ekranu na telefonie, 200 px od tabletu w górę.
// Zaokrąglone w górę, żeby przeglądarka nie wzięła pliku mniejszego niż kafelek.
const HOME_TILE_SIZES = "(min-width: 768px) 200px, 50vw";

// Strona główna zostaje przy opisie całego sklepu — to ten sam tekst, bo to ta
// sama treść. Własny ma za to `canonical`, żeby /pl i /en nie konkurowały ze
// sobą w wynikach wyszukiwania.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildPageMetadata({ locale, route: "/" });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, categories, featured] = await Promise.all([
    getTranslations({ locale }),
    productService.getCategoryTiles(),
    productService.getFeaturedProducts(),
  ]);

  return (
    <>
      {/* Hero */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8">
        <section className="bg-[var(--color-accent)] flex flex-col md:flex-row md:min-h-[580px]">
          <div className="md:w-[42%] flex-shrink-0 min-h-[300px] md:min-h-0">
            <PhotoSlider
              photos={HERO_SLIDER_PHOTOS.map((src, i) => ({
                src,
                alt: t("home.sliderAlt", { number: i + 1 }),
              }))}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="flex-1 flex items-center px-10 md:px-14 py-12">
            <div>
              <h1 className="text-2xl font-light tracking-wide mb-5">
                {t("home.heroTitle")}
              </h1>
              <p className="text-sm leading-relaxed mb-10">
                {t("home.heroText")}
              </p>
              <Link
                href="/about"
                className={buttonClass()}
              >
                {t("home.heroLink")}
                <ButtonArrow />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Categories */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-10">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
          {t("home.categories")}
        </h2>
        {/* Wrapping row rather than a fixed grid — the number of categories
            follows WooCommerce, so the tiles stay centred whatever it is.
            Zdjęcie zamiast ikonki w pustej ramce (P10): obrazek kategorii
            z WordPressa, a bez niego najnowsza dostępna praca z kategorii. */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-8">
          {categories.map((cat) => (
            <CategoryTile
              key={cat.slug}
              category={cat}
              label={getCategoryLabel(t, cat)}
              sizes={HOME_TILE_SIZES}
              className="w-[calc(50%-0.5rem)] md:w-[200px] text-center"
            />
          ))}
        </div>
      </section>

      {/* Selected works */}
      <FeaturedWorks products={featured} locale={locale} />

      {/* Quote */}
      <Quote text={t("home.quote")} author={t("home.quoteAuthor")} />

      {/* Ulubione klienta. Sekcja rysuje się w przeglądarce i znika sama, gdy
          lista jest pusta — czyli u większości wchodzących nie ma jej wcale. */}
      <WishlistCarousel />

      {/* Opinie zamykają stronę główną. Slider pokazuje wybraną dziesiątkę,
          a komplet siedzi na osobnej stronie „Opinie". */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
          {t("reviews.title")}
        </h2>
        <ReviewsSlider reviews={getFeaturedReviews()} />
      </section>
    </>
  );
}
