import { CategoryProps } from "@/contracts/server/product";

// next-intl translator, narrowed to what the label needs.
type CategoryTranslator = ((key: string) => string) & {
  has: (key: string) => boolean;
};

// The category name shown to the customer: the translation under
// `categories.<slug>` when the catalogue has one, otherwise the name straight
// from WooCommerce (Polish). This way Magda can add a category in WordPress and
// it appears everywhere at once — a translation is an optional extra, not a
// prerequisite.
export const getCategoryLabel = (
  t: CategoryTranslator,
  category: Pick<CategoryProps, "slug" | "name">
): string => {
  const key = `categories.${category.slug}`;
  return t.has(key) ? t(key) : category.name;
};
