import { Currency } from "@/contracts/shared";

// Stan płatności w ujęciu, jakie ma znaczenie dla zamówienia. Metody odroczone
// (np. Klarna) potrafią odesłać klienta do sklepu, kiedy Stripe jeszcze
// potwierdza przelew — pieniędzy nie ma, ale zamówienie musi powstać, żeby nie
// zginęło razem z płatnością.
export enum PaymentStatus {
  Succeeded = "succeeded",
  Processing = "processing",
  Unusable = "unusable",
}

// Co Stripe naprawdę wie o płatności — jedyne źródło prawdy o tym, czy i ile
// klient zapłacił. Wcześniej zamówienie wierzyło na słowo temu, co przyszło
// w żądaniu z przeglądarki.
export type PaymentRecord = {
  id: string;
  status: PaymentStatus;
  currency: Currency | null;
  // Zapłacona kwota w jednostkach głównych (zł / €).
  paidTotal: number;
  // Zapis koszyka i kraj zapamiętane w chwili tworzenia płatności — patrz
  // PricedCart.fingerprint.
  cart: string;
  country: string;
  // Zamówienie przypisane do tej płatności. Numer zapisuje albo kasa (gdy
  // zamówienie powstało z płatności), albo panel klienta (gdy płatność powstała
  // DLA zamówienia, które już było) — dlatego numer bywa bez klucza, a sam
  // klucz nigdy bez numeru.
  orderId: number | null;
  orderKey: string | null;
};
