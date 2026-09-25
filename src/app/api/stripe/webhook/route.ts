import { checkoutService } from "@/lib/service/checkout";
import { paymentService } from "@/lib/service/payment";

// Webhook Stripe'a — druga, niezależna od przeglądarki droga do domknięcia
// zamówienia. Klient, który zapłacił BLIK-iem w aplikacji banku i nie wrócił
// do sklepu, dostaje zamówienie tak samo jak ten, który wrócił. Tą samą drogą
// dochodzi potwierdzenie metod odroczonych (Klarna), które wcześniej nie
// dochodziło wcale.
//
// Adres jest publiczny, więc wierzymy wyłącznie zdarzeniom z poprawnym
// podpisem. Bez STRIPE_WEBHOOK_SECRET trasa nie robi nic.
export async function POST(request: Request) {
  if (!paymentService.isWebhookConfigured()) {
    console.error("Stripe webhook: missing STRIPE_WEBHOOK_SECRET env var");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "missing signature" }, { status: 400 });
  }

  // Podpis liczy się z treści co do bajtu — dlatego tekst, nie JSON.
  const body = await request.text();

  let payment;
  try {
    payment = await paymentService.getWebhookPayment(body, signature);
  } catch {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  // Zdarzenie, które nas nie dotyczy, albo płatność, której nie da się
  // odczytać — Stripe dostaje 200, żeby nie ponawiał w nieskończoność.
  if (!payment) return Response.json({ received: true });

  try {
    const order = await checkoutService.completePayment(payment);
    return Response.json({ received: true, orderId: order?.id ?? null });
  } catch (error) {
    // 500 = Stripe ponowi to zdarzenie później (przez kilka dni), a domknięcie
    // jest powtarzalne. Lepsze niż 200 i zgubione zamówienie.
    console.error(`Stripe webhook: payment ${payment.id} not completed:`, error);
    return Response.json({ error: "not completed" }, { status: 500 });
  }
}
