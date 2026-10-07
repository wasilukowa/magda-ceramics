export type CartItem = {
  id: number;
  slug: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
};

export type AddToCartInput = Omit<CartItem, "quantity">;

// Jak pozycja koszyka wygląda TERAZ w WooCommerce. Koszyk w przeglądarce
// pamięta cenę i nazwę z chwili dodania — po kilku dniach jedno i drugie może
// być nieaktualne, a praca może być już sprzedana.
export type CartItemState = {
  id: number;
  name: string;
  price: string;
  // Da się jeszcze kupić: jest w WooCommerce, ma cenę i jest na stanie.
  purchasable: boolean;
};

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
  // Druga linia adresu (mieszkanie, piętro, firma) — opcjonalna.
  address_2: string;
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
  // Druga, nieobowiązkowa linia adresu: numer mieszkania, piętro, nazwa firmy
  // albo budynku. W Polsce zwykle zbędna (mieszczą się w „ulicy i numerze"),
  // ale w Wielkiej Brytanii, Francji, Hiszpanii czy we Włoszech to osobna
  // linijka na kopercie (decyzja 2026-10-07).
  street2: string;
  city: string;
  postcode: string;
  country: string;
  note: string;
};
