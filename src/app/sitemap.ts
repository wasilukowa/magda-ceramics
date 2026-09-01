import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL, SITEMAP_ROUTES } from "@/content/data";
import { StaticRoute } from "@/content/types";
import { productService } from "@/lib/service/product";

const absolute = (path: string) => new URL(path, SITE_URL).toString();

// Każdy adres trafia do mapy raz, z odsyłaczami do swojej drugiej wersji
// językowej. Adres główny wpisu jest w języku domyślnym (angielski, bez
// prefiksu); polski siedzi w `alternates`, dokładnie tak, jak zaleca
// dokumentacja next-intl.
function entry(
  href: StaticRoute | { pathname: "/shop/[category]"; params: { category: string } }
  | { pathname: "/product/[slug]"; params: { slug: string } }
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, absolute(getPathname({ locale, href }))])
  );

  return {
    url: languages[routing.defaultLocale],
    alternates: { languages },
  };
}

// Katalog przychodzi z WooCommerce, więc nowy kubek wchodzi do mapy sam.
// Awaria API nie może jednak wywalić builda — od P4 strony pytają o produkty
// z wyprzedzeniem i jeden błąd kładzie cały deploy. Przy niepowodzeniu mapa
// zostaje przy stronach statycznych, zamiast nie powstać wcale.
async function catalogueEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const [categories, products] = await Promise.all([
      productService.getCategories(),
      productService.getProducts(),
    ]);

    return [
      ...categories.map((category) =>
        entry({ pathname: "/shop/[category]", params: { category: category.slug } })
      ),
      ...products.map((product) =>
        entry({ pathname: "/product/[slug]", params: { slug: product.slug } })
      ),
    ];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [...SITEMAP_ROUTES.map((route) => entry(route)), ...(await catalogueEntries())];
}
