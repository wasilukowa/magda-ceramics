export type RawProductImage = {
  src: string;
  alt: string;
};

export type RawProductCategory = {
  id: number;
  name: string;
  slug: string;
};

export type RawProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  date_created: string;
  description: string;
  short_description: string;
  images: RawProductImage[];
  categories: RawProductCategory[];
  stock_status: string;
  meta_data?: RawMetaData[];
};

export type RawMetaData = {
  key: string;
  value: string | number;
};

export type RawCategory = {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: { src: string; alt: string } | null;
};

export type ProductImage = {
  src: string;
  alt: string;
};

export type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

// Wymiary trzymane jako liczby w polach ACF, nie w treści opisu. Dzięki temu
// etykiety biorą się z tłumaczeń i produkt czyta się tak samo po polsku i po
// angielsku, a Magda wpisuje w WooCommerce same liczby.
export enum ProductDimensionKey {
  Capacity = "capacity",
  Diameter = "diameter",
  Height = "height",
  Width = "width",
  Length = "length",
}

export type ProductDimension = {
  key: ProductDimensionKey;
  value: number;
  unit: "ml" | "cm";
};

export type ProductProps = {
  id: number;
  name: string;
  slug: string;
  price: string;
  priceEur: number | null;
  hasPrice: boolean;
  description: string;
  shortDescription: string;
  images: ProductImage[];
  categories: ProductCategory[];
  dimensions: ProductDimension[];
  inStock: boolean;
  // Data dodania w WooCommerce — po niej idzie domyślne sortowanie „najnowsze".
  createdAt: string;
};

export type CategoryProps = {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: ProductImage | null;
};

// A category shown as a tile when the page has no products of its own. The
// image is the category picture from WooCommerce, or the first product photo
// when the category has none.
export type CategoryTileProps = {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: ProductImage | null;
};

// Porządek listy produktów. Wartości trafiają wprost do adresu (?sort=…), więc
// zmiana którejkolwiek unieważnia linki, które klienci mogli już zapisać.
export enum ProductSort {
  Newest = "newest",
  PriceAsc = "price-asc",
  PriceDesc = "price-desc",
  NameAsc = "name-asc",
}

// Filtr dostępności. Ceramika to pojedyncze sztuki — sprzedany kubek zostaje
// na liście (można obejrzeć), ale klient może go schować.
export enum ProductAvailability {
  All = "all",
  InStock = "in-stock",
}
