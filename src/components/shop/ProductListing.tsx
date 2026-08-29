import { getTranslations } from "next-intl/server";
import ProductCard from "@/components/ProductCard";
import ProductToolbar from "@/components/shop/ProductToolbar";
import { productService } from "@/lib/service/product";
import {
  filterByAvailability,
  parseProductAvailability,
  parseProductSort,
  sortProducts,
} from "@/lib/helpers/product";

// Ta część strony czyta adres (?sort=, ?availability=), więc — inaczej niż
// nagłówek i rząd kategorii — nie da się jej policzyć z góry przy budowaniu.
// Dlatego siedzi za własną granicą <Suspense>: skorupa strony zostaje
// statyczna, a dosyła się tylko siatka. Same produkty i tak idą z cache'u
// („use cache" w serwisie), więc to dosłanie jest tanie.
export default async function ProductListing({
  locale,
  categoryId,
  searchParams,
}: {
  locale: string;
  categoryId?: number;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { sort, availability } = await searchParams;
  const chosenSort = parseProductSort(sort);
  const chosenAvailability = parseProductAvailability(availability);

  const [t, tProduct, products] = await Promise.all([
    getTranslations({ locale, namespace: "shop" }),
    getTranslations({ locale, namespace: "product" }),
    productService.getProducts(categoryId),
  ]);

  const visible = sortProducts(
    filterByAvailability(products, chosenAvailability),
    chosenSort,
    locale
  );

  return (
    <>
      <ProductToolbar
        sort={chosenSort}
        availability={chosenAvailability}
        count={visible.length}
      />

      {visible.length === 0 ? (
        <p className="text-center text-[var(--muted)] py-12">{t("noMatching")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              soldOutLabel={tProduct("outOfStock")}
            />
          ))}
        </div>
      )}
    </>
  );
}
