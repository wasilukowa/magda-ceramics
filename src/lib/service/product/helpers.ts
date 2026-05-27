import {
  RawProduct,
  RawCategory,
  ProductProps,
  CategoryProps,
} from "@/contracts/server/product";

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
