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

// Gdzie zamówienie jest z pieniędzmi — w ujęciu klienta, nie WooCommerce.
// Zamówienie składa się PRZED zapłatą (decyzja Natalii 2026-10-08), więc
// „złożone” i „opłacone” to dwa różne kroki.
export enum OrderPaymentState {
  // Złożone, czeka na wpłatę. Praca jest zarezerwowana do `reservedUntil`.
  Unpaid = "unpaid",
  // Metoda odroczona (np. Klarna): bank jeszcze potwierdza płatność.
  AwaitingConfirmation = "awaiting-confirmation",
  Paid = "paid",
  Cancelled = "cancelled",
  // Zwrócone — zamówienie jest zamknięte.
  Refunded = "refunded",
}

export type OrderProps = {
  id: number;
  number: string;
  // Klucz zamówienia z WooCommerce. Razem z numerem otwiera stronę zamówienia
  // bez logowania (link w mailu) — dlatego nigdy nie trafia do adresu
  // niczyjego poza właścicielem.
  key: string;
  status: OrderStatus;
  dateCreated: string; // ISO
  total: number;
  currency: Currency;
  items: OrderLineItem[];
  paymentState: OrderPaymentState;
  // Do kiedy praca czeka zarezerwowana (ISO). Null przy zamówieniach sprzed
  // rezerwacji i przy tych, które już nie czekają.
  reservedUntil: string | null;
  // Czeka na pieniądze i da się za nie zapłacić. Liczone raz, w adapterze,
  // żeby widok nie musiał znać reguł WooCommerce.
  payable: boolean;
};

// Stany, w których zamówienie wciąż czeka na zapłatę. „on-hold" to zamówienie
// złożone i nieopłacone — WooCommerce przy wejściu w ten stan sam zdejmuje
// sztukę z magazynu, a przy anulowaniu ją oddaje. Tym samym stanem czeka
// metoda odroczona (Klarna), ale tę rozpoznaje się po stanie płatności
// w Stripe i zapłacić drugi raz się jej nie da. „failed" kończy płatność
// odrzuconą w starszych zamówieniach.
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
  // Stripe już raz powiedział „płatność w toku" (metoda odroczona).
  awaitingConfirmation: boolean;
  // Zamówienie złożone z rezerwacją (od 2026-10-08) — do kiedy czeka.
  reservedUntil: string | null;
  // Ostatnia płatność w Stripe założona dla tego zamówienia — przy anulowaniu
  // trzeba ją zamknąć, żeby nie dało się zapłacić za anulowane.
  paymentIntentId: string | null;
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

// Zamówienie okrojone do pozycji — tyle wystarcza, żeby wiedzieć, które prace
// są zarezerwowane (patrz ProductService.getReservedIds).
export type RawReservingOrder = {
  line_items?: Pick<RawOrderLineItem, "product_id">[];
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

// Złożone i nieopłacone zamówienie z rezerwacją — tyle, ile trzeba, żeby
// przypomnieć klientowi o zapłacie albo anulować je po terminie.
export type UnpaidOrder = {
  id: number;
  number: string;
  key: string;
  total: number;
  currency: Currency;
  email: string;
  firstName: string;
  locale: string;
  items: OrderLineItem[];
  // Do kiedy praca czeka (ISO).
  reservedUntil: string;
  // Ile przypomnień już wyszło (0, 1 albo 2).
  remindersSent: number;
  // Bank właśnie potwierdza płatność (metoda odroczona) — nie przypominamy.
  awaitingConfirmation: boolean;
};

// Co zrobić z nieopłaconym zamówieniem w danej chwili.
export enum ReservationStep {
  Wait = "wait",
  Remind = "remind",
  Expire = "expire",
}

// Wynik jednego przebiegu pilnowania rezerwacji (patrz ReservationService).
export type ReservationRun = {
  checked: number;
  reminded: number;
  cancelled: number;
  failed: number;
};

// Dlaczego zamówienie zostało anulowane — od tego zależy treść maila.
export enum CancelReason {
  // Minęło 48 h bez wpłaty.
  Expired = "expired",
  // Klient sam anulował (przycisk w mailu albo na stronie zamówienia).
  Customer = "customer",
}

// Czym kończy się próba anulowania nieopłaconego zamówienia.
export enum CancelResult {
  Cancelled = "cancelled",
  // W ostatniej chwili okazało się, że zapłacono — zamówienie zostaje.
  Paid = "paid",
  // Nie czeka na wpłatę (opłacone, już anulowane albo bank właśnie
  // potwierdza płatność) — nie ma czego anulować.
  NotCancellable = "not-cancellable",
}

// Czym kończy się domknięcie płatności z kasy — obojętne, czy domyka je strona
// potwierdzenia, czy webhook Stripe'a.
export enum OrderCompletion {
  // Stripe potwierdził pieniądze, zamówienie jest opłacone.
  Paid = "paid",
  // Metoda odroczona (np. Klarna): Stripe jeszcze potwierdza. Zamówienie czeka
  // wstrzymane, a webhook domknie je, gdy pieniądze dojdą.
  AwaitingConfirmation = "awaiting-confirmation",
  // Zamówienie złożone, ale płatność nie przeszła — czeka na drugą próbę.
  Unpaid = "unpaid",
}

// Wynik domknięcia: numer zamówienia do pokazania klientowi i to, jak się
// skończyło. Brak wyniku (null) znaczy, że płatności nie da się przypisać do
// żadnego zamówienia z kasy.
export type CompletedOrder = {
  id: number;
  completion: OrderCompletion;
};

// Co strona potwierdzenia dostaje po powrocie ze Stripe'a. Klucz zamówienia
// tylko przy nieudanej płatności — żeby przekierować klienta na stronę
// zamówienia, gdzie spróbuje jeszcze raz.
export type CheckoutReturn = {
  orderId: number;
  completion: OrderCompletion;
  key?: string;
};

// --- Maile do klienta --------------------------------------------------------
// Wysyła je sklep, nie WooCommerce: w języku i walucie klienta (WooCommerce
// pisał po angielsku i w złotych do wszystkich).

export enum CustomerMailKind {
  // Złożone — czeka na wpłatę, praca zarezerwowana.
  Placed = "placed",
  // Zapłacone.
  Confirmed = "confirmed",
  // Metoda odroczona — bank jeszcze potwierdza.
  OnHold = "on-hold",
  // Magda oznaczyła zamówienie jako zrealizowane.
  Shipped = "shipped",
  // Magda dodała notatkę „dla klienta".
  Note = "note",
  Refunded = "refunded",
  // Anulowane przed zapłatą — patrz CancelReason.
  Cancelled = "cancelled",
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
  // Klucz zamówienia — do linku „Zapłać" bez logowania.
  key: string;
  // Do kiedy praca czeka zarezerwowana (ISO), jeśli czeka.
  reservedUntil: string | null;
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
    placed: boolean;
    confirmation: boolean;
    onHold: boolean;
    cancelled: boolean;
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
  // Powód anulowania (CustomerMailKind.Cancelled).
  cancelReason?: CancelReason;
};

// Webhook WooCommerce „action.woocommerce_new_customer_note": pierwszy
// argument akcji, czyli numer zamówienia i treść notatki.
export type RawCustomerNoteAction = {
  action: string;
  arg: { order_id: number; customer_note: string };
};

