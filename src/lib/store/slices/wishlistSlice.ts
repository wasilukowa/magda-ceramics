export type WishlistStore = {
  ids: number[];
  count: number;
  isInWishlist: (id: number) => boolean;
  toggle: (id: number) => void;
};
