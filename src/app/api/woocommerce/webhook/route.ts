import { RawCustomerNoteAction, RawOrder } from "@/contracts/server/order";
import { customerMailService } from "@/lib/service/customerMail";
import { isValidWooSignature, isWooPing } from "@/lib/service/customerMail/helpers";

// Tematy webhooków WooCommerce, na które sklep odpowiada mailem do klienta.
const TOPIC_ORDER_UPDATED = "order.updated";
const TOPIC_CUSTOMER_NOTE = "action.woocommerce_new_customer_note";

// Webhook WooCommerce — zmiany, które Magda robi w panelu WordPressa:
// „Zrealizowane" (paczka wysłana), notatka dla klienta, zwrot. Na każdą z nich
// klient dostaje mail od sklepu, w swoim języku i walucie (patrz
// CustomerMailService).
//
// Adres jest publiczny, więc liczy się wyłącznie żądanie z poprawnym podpisem.
// Odpowiadamy 200 także wtedy, gdy coś po naszej stronie się nie uda:
// WooCommerce nie ponawia dostaw, a po pięciu nieudanych z rzędu WYŁĄCZA
// webhook — błąd jednego maila nie może odciąć wszystkich następnych.
export async function POST(request: Request) {
  const secret = process.env.WC_WEBHOOK_SECRET;
  if (!secret) {
    console.error("WooCommerce webhook: missing WC_WEBHOOK_SECRET env var");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  // Podpis liczy się z treści co do bajtu — dlatego tekst, nie JSON.
  const body = await request.text();
  const topic = request.headers.get("x-wc-webhook-topic");

  if (!topic && isWooPing(body)) return Response.json({ received: true });

  if (!isValidWooSignature(body, request.headers.get("x-wc-webhook-signature"), secret)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    if (topic === TOPIC_ORDER_UPDATED) {
      await customerMailService.handleOrderUpdated(JSON.parse(body) as RawOrder);
    } else if (topic === TOPIC_CUSTOMER_NOTE) {
      const { arg } = JSON.parse(body) as RawCustomerNoteAction;
      await customerMailService.sendNote(Number(arg?.order_id), String(arg?.customer_note ?? ""));
    }
  } catch (error) {
    console.error(`WooCommerce webhook (${topic}) failed:`, error);
  }

  return Response.json({ received: true });
}
