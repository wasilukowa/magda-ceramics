import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { productService } from "@/lib/service/product";
import { ButtonArrow, buttonClass } from "@/components/ui/button";
import { ButtonVariant } from "@/contracts/shared";
import BrokenCup from "@/components/BrokenCup";
import ProductCard from "@/components/ProductCard";

// Widok „nie ma takiej strony". Wydzielony, bo rysują go dwa miejsca:
// `[locale]/not-found.tsx` (granica dla `notFound()`) oraz strony, które
// świadomie renderują go WPROST zamiast rzucać `notFound()` — patrz komentarz
// w `[locale]/[...rest]/page.tsx`.
//
// Język bierze się z `setRequestLocale()` w layoucie `[locale]`, więc komponent
// nie potrzebuje własnych parametrów.
//
// Wygląd z 2026-10-19 (prośba Natalii o ładniejszą stronę): duże „404" z pękniętym
// kubkiem zamiast zera, a pod spodem kilka prac ze sklepu, żeby klient miał
// dokąd pójść dalej. Cyfry „nowoczesne" (`lining-nums`) — Cormorant domyślnie
// ma staroświeckie, w których 4 schodzi pod linię i kubek wisiał za wysoko.
export default async function NotFoundView() {
  const t = await getTranslations("notFound");

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-24">
      <div className="flex flex-col items-center text-center">
        <p className="sr-only">404</p>
        <div
          aria-hidden="true"
          className="flex items-end gap-2 sm:gap-4 font-quote font-light leading-none lining-nums text-[7rem] sm:text-[10rem]"
        >
          <span>4</span>
          <BrokenCup className="w-[5.5rem] sm:w-[8rem] mb-[0.11em] text-[var(--color-heart)]" />
          <span>4</span>
        </div>

        <h1 className="mt-10 font-quote italic text-3xl sm:text-4xl">{t("heading")}</h1>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed max-w-md">{t("text")}</p>

        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <Link href="/shop" className={buttonClass()}>
            {t("shop")}
            <ButtonArrow />
          </Link>
          <Link href="/" className={buttonClass({ variant: ButtonVariant.Secondary })}>
            {t("home")}
          </Link>
        </div>
      </div>

      <Suspense fallback={null}>
        <Suggestions heading={t("suggestions")} />
      </Suspense>
    </div>
  );
}

// Prace, które da się kupić — te same co „Wybrane prace" na stronie głównej.
// Gdy WooCommerce nie odpowie, sekcja po prostu się nie pokazuje.
async function Suggestions({ heading }: { heading: string }) {
  const products = (await productService.getFeaturedProducts(await getLocale())).slice(0, 4);
  if (products.length === 0) return null;

  return (
    <section className="mt-24">
      <h2 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] text-center mb-12">
        {heading}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
