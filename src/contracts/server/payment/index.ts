import { Currency } from "@/contracts/shared";

// Stan płatności w ujęciu, jakie ma znaczenie dla zamówienia. Metody odroczone
// (np. Klarna) potrafią odesłać klienta do sklepu, kiedy Stripe jeszcze
// potwierdza przelew — pieniędzy nie ma, ale zamówienie musi powstać, żeby nie
// zginęło razem z płatnością.
export enum PaymentStatus {
  Succeeded = "succeeded",
  Processing = "processing",
  // Płatność czeka na klienta: karta jeszcze niepodana, niepotwierdzona albo
  // w trakcie 3-D Secure. Tylko do takiej kasa może przypiąć zamówienie.
  AwaitingPayment = "awaiting-payment",
  // Anulowana — nic już z niej nie będzie.
  Unusable = "unusable",
}

// Co Stripe naprawdę wie o płatności — jedyne źródło prawdy o tym, czy i ile
// klient zapłacił. Wcześniej zamówienie wierzyło na słowo temu, co przyszło
// w żądaniu z przeglądarki.
export type PaymentRecord = {
  id: string;
  status: PaymentStatus;
  currency: Currency | null;
  // Zapłacona kwota w jednostkach głównych (zł / € / £).
  paidTotal: number;
  // Zamówienie przypisane do tej płatności. Płatność powstaje zawsze DLA
  // złożonego zamówienia (kasa po „Złóż zamówienie" albo strona zamówienia)
  // i dostaje jego numer i klucz. Płatności sprzed 2026-10-12 bywają bez
  // klucza (panel klienta) — sam klucz nigdy nie jest bez numeru.
  orderId: number | null;
  orderKey: string | null;
};
