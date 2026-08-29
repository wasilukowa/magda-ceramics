import {
  RawProduct,
  RawCategory,
  ProductProps,
  CategoryProps,
  ProductDimension,
  ProductDimensionKey,
} from "@/contracts/server/product";

// Pola ACF wracają z WooCommerce jako tekst, a liczbę ułamkową wpisuje się w
// polskim panelu z przecinkiem („4,5"). parseFloat urwałby na nim wartość do 4,
// więc przecinek zamieniamy na kropkę.
function parseAcfNumber(value: string | number | undefined): number | null {
  const parsed =
    typeof value === "number" ? value : parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// Hand-set EUR price from the `price_eur` custom field (ACF) in WooCommerce.
// Returns null when unset/invalid so the UI falls back to auto-conversion.
function getPreparedPriceEur(raw: RawProduct): number | null {
  return parseAcfNumber(raw.meta_data?.find((meta) => meta.key === "price_eur")?.value);
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

export function prepareProduct(raw: RawProduct): ProductProps {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    price: raw.price,
    priceEur: getPreparedPriceEur(raw),
    hasPrice: !!raw.price && parseFloat(raw.price) > 0,
    description: raw.description,
    shortDescription: raw.short_description,
    images: raw.images.map((img) => ({ src: img.src, alt: img.alt })),
    categories: raw.categories
      .filter((c) => c.slug !== UNCATEGORIZED_SLUG)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    dimensions: getPreparedDimensions(raw),
    inStock: raw.stock_status === "instock",
    createdAt: raw.date_created,
  };
}

export function prepareCategory(raw: RawCategory): CategoryProps {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    count: raw.count,
    image: raw.image ? { src: raw.image.src, alt: raw.image.alt } : null,
  };
}
