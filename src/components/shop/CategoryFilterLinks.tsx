import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CategoryProps } from "@/contracts/server/product";
import { getCategoryLabel } from "@/lib/helpers/category";
import { cn } from "@/lib/utils";

// Rząd kategorii nad siatką produktów. Ten sam na /sklep i na stronie
// kategorii — brak `activeSlug` znaczy „wszystkie".
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
      "text-xs tracking-widest uppercase border px-5 py-2 transition-colors",
      isActive
        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
        : "border-[var(--border)] hover:border-[var(--foreground)]"
    );

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12">
      <Link href="/shop" className={linkClass(!activeSlug)}>
        {t("categories.all")}
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={{ pathname: "/shop/[category]", params: { category: category.slug } }}
          className={linkClass(category.slug === activeSlug)}
        >
          {getCategoryLabel(t, category)}
        </Link>
      ))}
    </div>
  );
}
