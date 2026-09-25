import { checkoutService } from "@/lib/service/checkout";
import { paymentService } from "@/lib/service/payment";
import {
  checkoutErrorResponse,
  completeOrderRequestSchema,
} from "@/lib/service/checkout/helpers";
import { CheckoutError } from "@/contracts/server/checkout";

// Strona potwierdzenia po powrocie ze Stripe'a. Dane zamówienia nie
// przychodzą stąd — zamówienie istnieje od chwili kliknięcia „Zapłać", a numer
// płatności mówi tylko, KTÓRĄ płatność sprawdzić. Opłacenie zamówienia zapisuje
// webhook, więc nie szkodzi, jeśli klient tu nie wróci albo wróci dwa razy.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = completeOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  const payment = await paymentService.getPayment(parsed.data.paymentIntentId);
  if (!payment) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  // Z webhookiem to on zapisuje zamówienie — tu tylko mówimy klientowi, jak
  // jest. Dwie drogi piszące naraz zdublowały maile i zdjęły sztukę z magazynu
  // dwa razy (#282). Bez webhooka (lokalnie) zapisujemy stąd, jak dotąd.
  if (paymentService.isWebhookConfigured()) {
    const order = checkoutService.describePayment(payment);
    return order
      ? Response.json({ orderId: order.id, completion: order.completion })
      : checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  let order;
  try {
    order = await checkoutService.completePayment(payment);
  } catch (error) {
    // Pieniądze są w Stripe, a webhook spróbuje jeszcze raz — tu tylko ślad.
    console.error(`Payment ${payment.id}: completion failed:`, error);
    return checkoutErrorResponse(CheckoutError.OrderFailed);
  }

  if (!order) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  return Response.json({ orderId: order.id, completion: order.completion });
}
