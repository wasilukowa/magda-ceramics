import { createHmac, timingSafeEqual } from "node:crypto";
import { CustomerOrderMail } from "@/contracts/server/order";
import { Currency } from "@/contracts/shared";

// Podpis webhooka WooCommerce: HMAC-SHA256 z treści żądania, zakodowany
// w base64, w nagłówku X-WC-Webhook-Signature. Bez zgodnego podpisu żądanie
// nie pochodzi od naszego WordPressa i niczego nie wysyłamy.
export const isValidWooSignature = (
  body: string,
  signature: string | null,
  secret: string
): boolean => {
  if (!signature) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(body, "utf8").digest("base64")
  );
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
};

// Ping, który WooCommerce wysyła przy zakładaniu webhooka — bez podpisu.
export const isWooPing = (body: string): boolean => /^webhook_id=\d+$/.test(body);

// Kwota zwrotu w walucie klienta. WooCommerce zapisuje zwrot w złotych.
// Dla zamówienia w złotych to dokładnie ta kwota; dla zamówienia w euro
// dokładnie znamy tylko pełny zwrot (= to, co pobrał Stripe). Części zwrotu
// w euro nie zgadujemy — mail mówi wtedy „zwróciłam część kwoty" bez liczby.
export const getRefundAmount = (
  order: CustomerOrderMail,
  amountPln: number
): { amount: number | null; full: boolean } => {
  const full = Math.abs(amountPln - order.totalPln) < 0.005;
  if (order.amounts.currency === Currency.PLN) return { amount: amountPln, full };
  return { amount: full ? order.amounts.total : null, full };
};
