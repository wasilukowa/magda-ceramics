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
  inStock: boolean;
};

export type CategoryProps = {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: ProductImage | null;
};
