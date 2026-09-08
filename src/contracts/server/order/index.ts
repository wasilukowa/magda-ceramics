// Domena: zamówienia klienta. Raw* = surowa odpowiedź WooCommerce.

export enum OrderStatus {
  Pending = "pending",
  Processing = "processing",
  OnHold = "on-hold",
  Completed = "completed",
  Cancelled = "cancelled",
  Refunded = "refunded",
  Failed = "failed",
}

export type OrderLineItem = {
  id: number;
  name: string;
  quantity: number;
  total: string;
};

export type OrderProps = {
  id: number;
  number: string;
  status: OrderStatus;
  dateCreated: string; // ISO
  total: string;
  currency: string;
  items: OrderLineItem[];
};

// Zamówienie właśnie złożone w WooCommerce — tyle, ile trzeba, żeby pokazać je
// klientowi i przypiąć do płatności w Stripe.
export type PlacedOrder = {
  id: number;
  key: string;
};

// Odpowiedź WooCommerce zaraz po utworzeniu zamówienia.
export type RawPlacedOrder = {
  id: number;
  order_key: string;
};

export type RawOrderLineItem = {
  id: number;
  name: string;
  quantity: number;
  total: string;
};

export type RawOrder = {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items: RawOrderLineItem[];
};
