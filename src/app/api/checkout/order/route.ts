import { headers } from "next/headers";
import { getSession } from "@/lib/auth/dal";
import { checkoutService } from "@/lib/service/checkout";
import { paymentService } from "@/lib/service/payment";
import { canDraftOrderFor } from "@/lib/service/payment/helpers";
import {
  checkoutErrorResponse,
  getCartFingerprint,
  getRequestError,
  placeOrderRequestSchema,
} from "@/lib/service/checkout/helpers";
import { isRateLimited } from "@/lib/helpers/rateLimit";
import { getShippingAmount, resolveDeliveryMethod } from "@/lib/helpers/shipping";
import { CheckoutError } from "@/contracts/server/checkout";
import { DeliveryMethod } from "@/contracts/server/shipping";

// Każde żądanie zapisuje zamówienie w WooCommerce, więc z jednego miejsca nie
// może ich przyjść bez końca. Uczciwy klient klika raz, najwyżej kilka razy.
const DRAFT_WINDOW_MS = 15 * 60 * 1000;
const DRAFT_LIMIT_PER_IP = 20;

// Złożenie zamówienia — tuż PRZED płatnością, przypięte do niej w Stripe.
// Zamówienie od tej chwili istnieje, a praca czeka na klienta 48 h; płatność
// domknie je webhookiem, a jeśli nie przejdzie, klient zapłaci później z linku
// w mailu. Patrz CheckoutService.placeOrder.
export async function POST(request: Request) {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`checkout-draft:${ip}`, DRAFT_LIMIT_PER_IP, DRAFT_WINDOW_MS)) {
    return checkoutErrorResponse(CheckoutError.TooManyAttempts);
  }

  const body = await request.json().catch(() => null);
  const parsed = placeOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return checkoutErrorResponse(getRequestError(body));
  }

  const { billing, items, paymentIntentId, note, locker, locale } = parsed.data;
  const deliveryMethod = resolveDeliveryMethod(
    billing.country,
    parsed.data.deliveryMethod,
    !!locker
  );

  // Zamówienie wolno przypiąć wyłącznie do płatności, która czeka na klienta
  // i którą kasa wyceniła za dokładnie ten koszyk, ten kraj i tę wysyłkę.
  const payment = await paymentService.getPayment(paymentIntentId);
  if (
    !payment ||
    !payment.currency ||
    !canDraftOrderFor(
      payment,
      getCartFingerprint(items),
      billing.country,
      getShippingAmount(billing.country, payment.currency, deliveryMethod)
    )
  ) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  // Właściciela zamówienia bierzemy z sesji, nigdy z żądania.
  const session = await getSession();

  const result = await checkoutService.placeOrder(
    {
      billing,
      items,
      note,
      customerId: session?.customerId ?? null,
      deliveryMethod,
      locker: deliveryMethod === DeliveryMethod.Locker ? locker : null,
      locale,
      // Waluta płatności, którą kasa wyceniła — nie to, co przyszło w żądaniu.
      currency: payment.currency,
    },
    payment
  );
  if (!result.ok) {
    return checkoutErrorResponse(result.error, result.unavailable);
  }

  // Numer i klucz zamówienia — gdyby płatność nie przeszła, przeglądarka
  // przeniesie klienta na stronę zamówienia, gdzie spróbuje jeszcze raz.
  return Response.json({ ok: true, orderId: result.order.id, key: result.order.key });
}
