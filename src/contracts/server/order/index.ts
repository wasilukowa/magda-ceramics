// Domena: zamówienia klienta. Raw* = surowa odpowiedź WooCommerce.

import { LedgerAmount } from "@/contracts/server/exchangeRate";
import { Currency } from "@/contracts/shared";

export enum OrderStatus {
  Pending = "pending",
  Processing = "processing",
  OnHold = "on-hold",
  Completed = "completed",
  Cancelled = "cancelled",
  Refunded = "refunded",
  Failed = "failed",
  // Szkic zapisany przez kasę tuż przed płatnością — patrz CheckoutService.
  // WooCommerce nie pokazuje go na liście zamówień, a przypomnienia o zapłacie
  // go nie widzą. Klient też nie, dopóki płatność go nie domknie.
  CheckoutDraft = "checkout-draft",
}

// Pozycja zamówienia z kwotą w walucie klienta (patrz OrderAmounts).
export type OrderLineItem = {
  id: number;
  name: string;
  quantity: number;
  total: number;
};

// Język i waluta, w których klient robił zakupy. W nich dostaje maile i widzi
// kwoty — także te zapisane później przez Magdę w panelu WordPressa.
export type OrderPreferences = {
  locale: string;
  currency: Currency;
};

// Kwoty zamówienia w walucie klienta. WooCommerce trzyma wszystko w złotych
// (tak księgujemy), więc dla zamówień w euro kwoty są przeliczane tą samą
// regułą co w kasie, a suma opłaconego zamówienia to dokładnie to, co pobrał
// Stripe.
export type OrderAmounts = {
  currency: Currency;
  items: OrderLineItem[];
  shipping: number;
  total: number;
};

export type OrderProps = {
  id: number;
  number: string;
  status: OrderStatus;
  dateCreated: string; // ISO
  total: number;
  currency: Currency;
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

// Zamówienie w takim ujęciu, jakiego potrzebuje domknięcie płatności: stan,
// klucz (po nim płatność z kasy poznaje „swoje" zamówienie) i pozycje, żeby
// sprawdzić, czy ktoś nie kupił tej samej pracy w międzyczasie.
export type OrderForPayment = {
  id: number;
  key: string;
  status: OrderStatus;
  items: { id: number; quantity: number }[];
  // Czy klient dostał już potwierdzenie — webhook Stripe'a potrafi przyjść
  // drugi raz, a potwierdzenie ma wyjść raz.
  confirmationSent: boolean;
  // To samo dla maila „nowe zamówienie" do pracowni.
  studioNotified: boolean;
};

// Odpowiedź WooCommerce zaraz po utworzeniu zamówienia.
export type RawPlacedOrder = {
  id: number;
  order_key: string;
};

export type RawOrderLineItem = {
  id: number;
  product_id?: number;
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
  order_key?: string;
  customer_id?: number;
  billing?: RawOrderAddress & { email?: string; phone?: string };
  shipping?: RawOrderAddress & { company?: string };
  shipping_total?: string;
  customer_note?: string;
  meta_data?: { key: string; value: string | number }[];
  // Data zapłaty (UTC, bez strefy na końcu). Null, dopóki nie zapłacono.
  date_paid_gmt?: string | null;
  // Skrót zwrotów — pełne dane (z datą) są pod orders/{id}/refunds.
  refunds?: { id: number; total: string }[];
};

export type RawOrderAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postcode?: string;
  country?: string;
};

// Zwrot z orders/{id}/refunds. `amount` jest dodatnie, w złotych.
export type RawOrderRefund = {
  id: number;
  date_created_gmt: string;
  amount: string;
};

// Opłacone zamówienie w ujęciu zestawienia sprzedaży: kiedy zapłacono, ile
// w złotych, czy w euro — i zwroty z datami.
export type SalesOrder = {
  id: number;
  number: string;
  // Chwila zapłaty, ISO w UTC.
  paidAt: string;
  totalPln: number;
  // Zapłacono w euro: kwota i przeliczenie NBP zapisane przy zapłacie
  // (puste, gdy NBP wtedy nie odpowiedział).
  eur: LedgerAmount | null;
  refunds: { createdAt: string; amountPln: number }[];
  // Opłacone, a potem anulowane. Pieniądze pewnie wróciły, ale zwrot liczy
  // się dopiero wtedy, gdy jest zapisany w WooCommerce.
  cancelled: boolean;
};

// Zamówienie czekające na zapłatę dłużej, niż wypada — tyle, ile trzeba, żeby
// wysłać klientowi przypomnienie.
export type UnpaidOrder = {
  id: number;
  number: string;
  total: number;
  currency: Currency;
  email: string;
  firstName: string;
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

// Czym kończy się domknięcie płatności z kasy — obojętne, czy domyka je strona
// potwierdzenia, czy webhook Stripe'a.
export enum OrderCompletion {
  // Stripe potwierdził pieniądze, zamówienie jest opłacone.
  Paid = "paid",
  // Metoda odroczona (np. Klarna): Stripe jeszcze potwierdza. Zamówienie czeka
  // wstrzymane, a webhook domknie je, gdy pieniądze dojdą.
  AwaitingConfirmation = "awaiting-confirmation",
}

// Wynik domknięcia: numer zamówienia do pokazania klientowi i to, jak się
// skończyło. Brak wyniku (null) znaczy, że płatności nie da się przypisać do
// żadnego zamówienia z kasy.
export type CompletedOrder = {
  id: number;
  completion: OrderCompletion;
};

// --- Maile do klienta --------------------------------------------------------
// Wysyła je sklep, nie WooCommerce: w języku i walucie klienta (WooCommerce
// pisał po angielsku i w złotych do wszystkich).

export enum CustomerMailKind {
  // Zapłacone.
  Confirmed = "confirmed",
  // Metoda odroczona — bank jeszcze potwierdza.
  OnHold = "on-hold",
  // Magda oznaczyła zamówienie jako zrealizowane.
  Shipped = "shipped",
  // Magda dodała notatkę „dla klienta".
  Note = "note",
  Refunded = "refunded",
}

export enum DeliveryKind {
  Locker = "locker",
  Courier = "courier",
}

export type OrderDelivery = {
  kind: DeliveryKind;
  // Kod paczkomatu (tylko dla paczkomatu).
  lockerCode: string | null;
  // Adres jak na kopercie: odbiorca, ulica, kod i miasto.
  lines: string[];
};

// Zamówienie w ujęciu maila do klienta.
export type CustomerOrderMail = {
  id: number;
  number: string;
  email: string;
  firstName: string;
  preferences: OrderPreferences;
  amounts: OrderAmounts;
  delivery: OrderDelivery;
  // Uwaga, którą klient sam wpisał w kasie (bez dopisku o paczkomacie).
  note: string;
  hasAccount: boolean;
  // Które maile już wyszły — patrz ORDER_META w serwisie zamówień.
  sent: {
    confirmation: boolean;
    onHold: boolean;
    shipped: boolean;
    refundIds: number[];
  };
  // Zwroty zapisane w WooCommerce: numer i kwota w złotych.
  refunds: { id: number; amountPln: number }[];
  // Suma zamówienia w złotych, jak w WooCommerce — do przeliczania zwrotów.
  totalPln: number;
};

// Zamówienie w ujęciu maila „nowe zamówienie" do pracowni. Kwoty w złotych
// z katalogu (tak księgujemy) plus to, co klient naprawdę zapłacił.
export type StudioOrderMail = {
  id: number;
  number: string;
  customerName: string;
  email: string;
  phone: string;
  hasAccount: boolean;
  // Język, w którym klient zamawiał (i dostaje maile).
  customerLocale: string;
  items: { name: string; quantity: number; totalPln: number }[];
  shippingPln: number;
  totalPln: number;
  // Waluta i kwota zapłaty; dla euro także przeliczenie do ewidencji.
  paidCurrency: Currency;
  paidTotal: number;
  ledger: LedgerAmount | null;
  delivery: OrderDelivery;
  note: string;
  notified: boolean;
};

// Co ma się znaleźć w mailu oprócz samego zamówienia.
export type CustomerMailInput = {
  kind: CustomerMailKind;
  order: CustomerOrderMail;
  // Treść notatki Magdy (CustomerMailKind.Note).
  note?: string;
  // Zwrot (CustomerMailKind.Refunded). Kwota w walucie klienta albo null,
  // gdy nie da się jej podać dokładnie (część zwrotu zamówienia w euro).
  refund?: { amount: number | null; full: boolean };
};

// Webhook WooCommerce „action.woocommerce_new_customer_note": pierwszy
// argument akcji, czyli numer zamówienia i treść notatki.
export type RawCustomerNoteAction = {
  action: string;
  arg: { order_id: number; customer_note: string };
};

