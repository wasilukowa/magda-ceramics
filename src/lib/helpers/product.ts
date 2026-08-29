import {
  ProductAvailability,
  ProductProps,
  ProductSort,
} from "@/contracts/server/product";
import { isString } from "@/utility";

// Wartość z adresu jest niczyja — może przyjść z pomyłki w linku albo z
// zabawy w pasku adresu. Nieznana wartość cofa się do domyślnej zamiast
// wysypywać stronę.
const parseEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T => (isString(value) && allowed.includes(value as T) ? (value as T) : fallback);

export const parseProductSort = (value: unknown): ProductSort =>
  parseEnum(value, Object.values(ProductSort), ProductSort.Newest);

export const parseProductAvailability = (value: unknown): ProductAvailability =>
  parseEnum(value, Object.values(ProductAvailability), ProductAvailability.All);

// Ceny porównujemy w złotych, nawet gdy klient ogląda sklep w euro. Ceny w euro
// Magda ustawia ręcznie (pole price_eur), więc kolejność mogłaby się między
// walutami minimalnie różnić — a adres z ?sort= ma prowadzić każdego do tej
// samej listy.
const priceInZloty = (product: ProductProps): number => parseFloat(product.price);

// Nazwy porównujemy zgodnie z alfabetem języka, w którym klient ogląda sklep —
// inaczej „Ł" wylądowałoby za „Z".
const byName = (locale: string) => {
  const collator = new Intl.Collator(locale);
  return (a: ProductProps, b: ProductProps) => collator.compare(a.name, b.name);
};

export const sortProducts = (
  products: ProductProps[],
  sort: ProductSort,
  locale: string
): ProductProps[] => {
  const sorted = [...products];

  switch (sort) {
    case ProductSort.PriceAsc:
      return sorted.sort((a, b) => priceInZloty(a) - priceInZloty(b));
    case ProductSort.PriceDesc:
      return sorted.sort((a, b) => priceInZloty(b) - priceInZloty(a));
    case ProductSort.NameAsc:
      return sorted.sort(byName(locale));
    case ProductSort.Newest:
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
};

export const filterByAvailability = (
  products: ProductProps[],
  availability: ProductAvailability
): ProductProps[] =>
  availability === ProductAvailability.InStock
    ? products.filter((product) => product.inStock)
    : products;
