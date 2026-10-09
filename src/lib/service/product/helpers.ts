import {
  RawProduct,
  RawCategory,
  ProductProps,
  CategoryProps,
  ProductDimension,
  ProductDimensionKey,
} from "@/contracts/server/product";
import { RawReservingOrder } from "@/contracts/server/order";

// Pola ACF wracają z WooCommerce jako tekst, a liczbę ułamkową wpisuje się w
// polskim panelu z przecinkiem („4,5"). parseFloat urwałby na nim wartość do 4,
// więc przecinek zamieniamy na kropkę.
function parseAcfNumber(value: string | number | undefined): number | null {
  const parsed =
    typeof value === "number" ? value : parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// Pola ACF z wymiarami. Kolejność listy jest tutaj, nie w WooCommerce, a puste
// pola po prostu nie trafiają na stronę — talerz nie musi mieć pojemności.
// Klucze bierzemy z myślnikiem, bo tak zapisał je WordPress, ale wersja z
// podkreśleniem też jest akceptowana — gdyby kiedyś pole powstało inaczej,
// strona nie przestanie pokazywać wymiarów. Jednostka nie jest częścią
// wartości: w polu siedzi sama liczba, „ml" i „cm" dokłada widok.
const DIMENSION_FIELDS = [
  { key: ProductDimensionKey.Capacity, metaKey: "capacity-ml", unit: "ml" },
  { key: ProductDimensionKey.Diameter, metaKey: "diameter-cm", unit: "cm" },
  { key: ProductDimensionKey.Height, metaKey: "height-cm", unit: "cm" },
  { key: ProductDimensionKey.Width, metaKey: "width-cm", unit: "cm" },
  { key: ProductDimensionKey.Length, metaKey: "length-cm", unit: "cm" },
] as const;

function getPreparedDimensions(raw: RawProduct): ProductDimension[] {
  return DIMENSION_FIELDS.flatMap(({ key, metaKey, unit }) => {
    const alias = metaKey.replace("-", "_");
    const value = raw.meta_data?.find(
      (meta) => meta.key === metaKey || meta.key === alias
    )?.value;
    const parsed = parseAcfNumber(value);
    return parsed === null ? [] : [{ key, value: parsed, unit }];
  });
}

// WooCommerce zawsze przypisuje produkt bez kategorii do „Uncategorized".
// To nazwa techniczna, po angielsku i nieprzetłumaczalna — nie pokazujemy jej
// klientowi (getCategories() odsiewa ją tak samo).
export const UNCATEGORIZED_SLUG = "uncategorized";

// Klucz sklepu widzi w WooCommerce także szkice, prywatne i oczekujące na
// przegląd — bez stanu w zapytaniu API oddaje WSZYSTKIE (poza koszem). Szkic
// z ceną trafiał więc do sklepu, archiwum i mapy strony, zanim Magda go
// opublikowała (N32, znalezione 2026-10-09 na TEST 1). Każde zapytanie
// o produkty niesie ten warunek.
export const PUBLISHED_ONLY = "status=publish";

export function prepareProduct(raw: RawProduct): ProductProps {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    price: raw.price,
    hasPrice: !!raw.price && parseFloat(raw.price) > 0,
    description: raw.description,
    shortDescription: raw.short_description,
    images: raw.images.map((img) => ({ src: img.src, alt: img.alt })),
    categories: raw.categories
      .filter((c) => c.slug !== UNCATEGORIZED_SLUG)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    dimensions: getPreparedDimensions(raw),
    inStock: raw.stock_status === "instock",
    // Rezerwację zna dopiero lista zamówień — patrz withReservations.
    reserved: false,
    createdAt: raw.date_created,
  };
}

// Prace w złożonych, nieopłaconych zamówieniach (status on-hold). WooCommerce
// zdjął je z magazynu, więc wyglądają jak sprzedane — a sprzedane nie są.
export const getReservedProductIds = (orders: RawReservingOrder[]): Set<number> =>
  new Set(
    orders.flatMap((order) =>
      (order.line_items ?? []).flatMap((item) => (item.product_id ? [item.product_id] : []))
    )
  );

// Oznacza zarezerwowane. Tylko te, których nie ma na stanie: praca, która
// wróciła do sklepu (np. Magda ręcznie zmieniła zamówienie), jest po prostu
// dostępna.
export const withReservations = (
  products: ProductProps[],
  reservedIds: Set<number>
): ProductProps[] =>
  products.map((product) =>
    !product.inStock && reservedIds.has(product.id)
      ? { ...product, reserved: true }
      : product
  );

export function prepareCategory(raw: RawCategory): CategoryProps {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    count: raw.count,
    image: raw.image ? { src: raw.image.src, alt: raw.image.alt } : null,
  };
}
