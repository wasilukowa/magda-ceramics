import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { Link } from "@/i18n/navigation";
import { StaticRoute } from "@/content/types";
import { getCategoryLabel } from "@/lib/helpers/category";
import { productService } from "@/lib/service/product";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "siteMap" });
  return buildPageMetadata({
    locale,
    route: "/sitemap",
    title: t("title"),
    description: t("intro"),
  });
}

// Mapa strony dla ludzi — ta druga, w `src/app/sitemap.ts`, jest dla
// wyszukiwarek i ma postać XML-a. Ta jest zwykłą stroną: jedna lista
// wszystkiego, co w sklepie da się odwiedzić. Kategorie i prace przychodzą
// z WooCommerce, więc nowy kubek pojawia się tu sam.
function Grupa({
  tytul,
  children,
}: {
  tytul: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">
        {tytul}
      </h2>
      <ul className="space-y-2 text-sm">{children}</ul>
    </section>
  );
}

function Pozycja({ href, children }: { href: StaticRoute; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
        {children}
      </Link>
    </li>
  );
}

export default async function SiteMapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tSite] = await Promise.all([
    getTranslations({ locale }),
    getTranslations({ locale, namespace: "siteMap" }),
  ]);

  // Awaria WooCommerce nie może położyć całej strony — zostają wtedy same
  // odnośniki stałe, a w miejscu listy prac staje jedno zdanie.
  let categories: Awaited<ReturnType<typeof productService.getCategories>> = [];
  let products: Awaited<ReturnType<typeof productService.getProducts>> = [];
  let katalogDostepny = true;

  try {
    [categories, products] = await Promise.all([
      productService.getCategories(),
      productService.getProducts(),
    ]);
  } catch {
    katalogDostepny = false;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-6 text-center">
        {tSite("title")}
      </h1>
      <p className="text-sm text-[var(--muted)] text-center mb-16">{tSite("intro")}</p>

      {/* Strona główna stoi osobno, nad grupami — nie należy ani do sklepu,
          ani do informacji, a schowana pod cudzym nagłówkiem czytała się jak
          pomyłka. */}
      <ul className="mb-12 text-sm">
        <li>
          <Link href="/" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            {t("nav.home")}
          </Link>
        </li>
      </ul>

      <div className="space-y-12">
        <Grupa tytul={tSite("shop")}>
          <Pozycja href="/shop">{`${t("nav.shop")} — ${t("categories.all")}`}</Pozycja>
          {categories.map((category) => (
            <li key={category.slug} className="pl-4">
              <Link
                href={{ pathname: "/shop/[category]", params: { category: category.slug } }}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                {getCategoryLabel(t, category)}
              </Link>
            </li>
          ))}
        </Grupa>

        <Grupa tytul={tSite("products")}>
          {katalogDostepny ? (
            products.map((product) => (
              <li key={product.slug}>
                <Link
                  href={{ pathname: "/product/[slug]", params: { slug: product.slug } }}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {product.name}
                </Link>
              </li>
            ))
          ) : (
            <li className="text-[var(--muted)]">{tSite("productsUnavailable")}</li>
          )}
        </Grupa>

        <Grupa tytul={tSite("info")}>
          <Pozycja href="/about">{t("footer.about")}</Pozycja>
          <Pozycja href="/reviews">{t("footer.reviews")}</Pozycja>
          <Pozycja href="/contact">{t("footer.contact")}</Pozycja>
        </Grupa>

        <Grupa tytul={tSite("account")}>
          <Pozycja href="/wishlist">{t("nav.wishlist")}</Pozycja>
          <Pozycja href="/login">{t("auth.login.title")}</Pozycja>
          <Pozycja href="/register">{t("auth.register.title")}</Pozycja>
        </Grupa>

        <Grupa tytul={tSite("legal")}>
          <Pozycja href="/shipping">{t("footer.shipping")}</Pozycja>
          <Pozycja href="/terms">{t("footer.terms")}</Pozycja>
          <Pozycja href="/privacy">{t("footer.privacy")}</Pozycja>
          <Pozycja href="/cookies">{t("footer.cookies")}</Pozycja>
        </Grupa>
      </div>
    </div>
  );
}
