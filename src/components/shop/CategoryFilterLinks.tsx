import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CategoryProps } from "@/contracts/server/product";
import { getCategoryLabel } from "@/lib/helpers/category";
import { cn } from "@/lib/utils";
import CategoryStrip from "./CategoryStrip";

// Rząd kategorii nad siatką produktów. Ten sam na /sklep i na stronie
// kategorii — brak `activeSlug` znaczy „wszystkie". Same linki powstają na
// serwerze (nazwy kategorii idą z tłumaczeń), a o tym, jak pasek się zachowuje
// na wąskim ekranie, decyduje CategoryStrip.
export default async function CategoryFilterLinks({
  locale,
  categories,
  activeSlug,
}: {
  locale: string;
  categories: CategoryProps[];
  activeSlug?: string;
}) {
  const t = await getTranslations({ locale });

  const linkClass = (isActive: boolean) =>
    cn(
      // `shrink-0` i `whitespace-nowrap` trzymają kafelek w jednym kawałku,
      // kiedy pasek się przewija — bez nich flex ścisnąłby je do nieczytelnych
      // słupków.
      "shrink-0 snap-start whitespace-nowrap text-xs tracking-widest uppercase border px-5 py-2 transition-colors",
      isActive
        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
        : "border-[var(--color-control-border)] hover:border-[var(--foreground)]"
    );

  return (
    <CategoryStrip>
      <Link
        href="/shop"
        data-active={!activeSlug}
        className={linkClass(!activeSlug)}
      >
        {t("categories.all")}
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={{ pathname: "/shop/[category]", params: { category: category.slug } }}
          data-active={category.slug === activeSlug}
          className={linkClass(category.slug === activeSlug)}
        >
          {getCategoryLabel(t, category)}
        </Link>
      ))}
    </CategoryStrip>
  );
}
