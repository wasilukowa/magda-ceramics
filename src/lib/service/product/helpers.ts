import {
  RawProduct,
  RawCategory,
  ProductProps,
  CategoryProps,
} from "@/contracts/server/product";

// Hand-set EUR price from the `price_eur` custom field (ACF) in WooCommerce.
// Returns null when unset/invalid so the UI falls back to auto-conversion.
function getPreparedPriceEur(raw: RawProduct): number | null {
  const value = raw.meta_data?.find((meta) => meta.key === "price_eur")?.value;
  const parsed = typeof value === "number" ? value : parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

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
    categories: raw.categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    inStock: raw.stock_status === "instock",
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
