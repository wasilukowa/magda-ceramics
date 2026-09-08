import { checkoutService } from "@/lib/service/checkout";
import { paymentService } from "@/lib/service/payment";
import { isPaymentFor } from "@/lib/service/payment/helpers";
import {
  checkoutErrorResponse,
  getCartFingerprint,
  getRequestError,
  orderRequestSchema,
} from "@/lib/service/checkout/helpers";
import { CheckoutError } from "@/contracts/server/checkout";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderRequestSchema.safeParse(body);

  if (!parsed.success) {
    return checkoutErrorResponse(getRequestError(body));
  }

  const { billing, items, paymentIntentId, note, deliveryMethod, locker } =
    parsed.data;

  // O tym, czy zapłacono, decyduje wyłącznie Stripe. Wcześniej wystarczył
  // zmyślony ciąg znaków w `paymentIntentId`, żeby dostać w WooCommerce
  // zamówienie ze statusem „opłacone".
  const payment = await paymentService.getPayment(paymentIntentId);
  if (!payment) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  // Jedna płatność, jedno zamówienie — odświeżenie strony potwierdzenia albo
  // powtórzone żądanie dostaje to samo zamówienie zamiast nowego.
  if (payment.orderId) {
    return Response.json({
      orderId: payment.orderId,
      orderKey: payment.orderKey,
    });
  }

  // Płatność musi być za dokładnie ten koszyk i ten kraj. Kraj sprawdzamy,
  // bo to on decyduje o cenie wysyłki — bez tego dało się zapłacić za wysyłkę
  // krajową i podać adres zagraniczny.
  if (!isPaymentFor(payment, getCartFingerprint(items), billing.country)) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  const result = await checkoutService.placeOrder({
    billing,
    items,
    note,
    payment,
    deliveryMethod,
    locker,
  });

  if (!result.ok) {
    return checkoutErrorResponse(result.error);
  }

  await paymentService.claimOrder(payment.id, result.order);

  return Response.json({
    orderId: result.order.id,
    orderKey: result.order.key,
  });
}
