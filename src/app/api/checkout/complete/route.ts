import { checkoutService } from "@/lib/service/checkout";
import { paymentService } from "@/lib/service/payment";
import {
  checkoutErrorResponse,
  completeOrderRequestSchema,
} from "@/lib/service/checkout/helpers";
import { CheckoutError } from "@/contracts/server/checkout";
import { CheckoutReturn, OrderCompletion } from "@/contracts/server/order";

// Strona potwierdzenia po powrocie ze Stripe'a. Dane zamówienia nie
// przychodzą stąd — zamówienie jest złożone od kliknięcia w kasie, a numer
// płatności mówi tylko, KTÓRĄ płatność sprawdzić. Opłacenie zamówienia zapisuje
// webhook, więc nie szkodzi, jeśli klient tu nie wróci albo wróci dwa razy.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = completeOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  const { paymentIntentId, clientSecret } = parsed.data;
  const payment = clientSecret
    ? await paymentService.getClientPayment(paymentIntentId, clientSecret)
    : await paymentService.getPayment(paymentIntentId);
  if (!payment) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  const described = checkoutService.describePayment(payment);
  if (!described) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  // Płatność nie przeszła, ale zamówienie jest złożone. Klucz zamówienia
  // (do strony, gdzie klient zapłaci jeszcze raz) dostaje tylko przeglądarka,
  // która płaciła — patrz getClientPayment.
  if (described.completion === OrderCompletion.Unpaid) {
    if (!clientSecret || !payment.orderKey) {
      return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
    }
    const unpaid: CheckoutReturn = {
      orderId: described.id,
      completion: described.completion,
      key: payment.orderKey,
    };
    return Response.json(unpaid);
  }

  // Z webhookiem to on zapisuje zamówienie — tu tylko mówimy klientowi, jak
  // jest. Dwie drogi piszące naraz zdublowały maile i zdjęły sztukę z magazynu
  // dwa razy (#282). Bez webhooka (lokalnie) zapisujemy stąd, jak dotąd.
  if (paymentService.isWebhookConfigured()) {
    const result: CheckoutReturn = { orderId: described.id, completion: described.completion };
    return Response.json(result);
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

  const result: CheckoutReturn = { orderId: order.id, completion: order.completion };
  return Response.json(result);
}
