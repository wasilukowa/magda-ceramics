export type ImageProps = {
  src: string;
  alt: string;
};

export type ProductGalleryProps = {
  images: ImageProps[];
  productName: string;
};

export type AddToCartButtonProps = {
  id: number;
  slug: string;
  name: string;
  price: string;
  image: string;
  inStock: boolean;
  hasPrice: boolean;
};
