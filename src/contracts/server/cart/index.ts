export type CartItem = {
  id: number;
  slug: string;
  name: string;
  price: string;
  priceEur: number | null;
  image: string;
  quantity: number;
};

export type AddToCartInput = Omit<CartItem, "quantity">;

export type OrderItem = {
  id: number;
  quantity: number;
};

export type BillingAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_1: string;
  city: string;
  postcode: string;
  country: string;
};

export type Address = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
  note: string;
};
