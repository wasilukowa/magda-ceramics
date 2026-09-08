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
  // Czeka na pieniądze — patrz PAYABLE_STATUSES. Liczone raz, w adapterze,
  // żeby widok nie musiał znać reguł WooCommerce.
  payable: boolean;
};

// Stany, w których zamówienie wciąż czeka na zapłatę. „on-hold" jest tu, bo
// tak zapisujemy zamówienie z metody odroczonej (Klarna), której Stripe
// jeszcze nie potwierdził, a „failed" — bo tak kończy płatność odrzucona.
export const PAYABLE_STATUSES = [
  OrderStatus.Pending,
  OrderStatus.OnHold,
  OrderStatus.Failed,
] as const;

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
  date_created_gmt?: string;
  total: string;
  currency: string;
  line_items: RawOrderLineItem[];
  billing?: { first_name?: string; email?: string; country?: string };
  meta_data?: { key: string; value: string | number }[];
};

// Zamówienie czekające na zapłatę dłużej, niż wypada — tyle, ile trzeba, żeby
// wysłać klientowi przypomnienie.
export type UnpaidOrder = {
  id: number;
  number: string;
  total: string;
  currency: string;
  email: string;
  firstName: string;
  // Język maila: klient nie podaje go wprost, więc idzie z kraju adresu.
  locale: string;
  items: OrderLineItem[];
};

// Czym kończy się domknięcie zapłaty za istniejące zamówienie.
export enum OrderConfirmResult {
  // Stripe potwierdził płatność (albo zamówienie było już opłacone).
  Paid = "paid",
  // Zapłacono, ale WooCommerce nie przyjął adnotacji — pieniądze są, wpis
  // trzeba poprawić ręcznie. Klientowi mówimy, że zapłacił, bo zapłacił.
  PaidNotRecorded = "paid-not-recorded",
  NotConfirmed = "not-confirmed",
}
