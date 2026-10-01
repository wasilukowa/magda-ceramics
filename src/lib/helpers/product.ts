import { ProductProps, ProductSort } from "@/contracts/server/product";
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

// Ceny porównujemy w złotych, nawet gdy klient ogląda sklep w euro. Euro to
// złotówki zaokrąglone w górę, więc dwie prace o różnych cenach mogą mieć tę
// samą cenę w euro — porządek wyznaczają złotówki, żeby adres z ?sort=
// prowadził każdego do tej samej listy.
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
