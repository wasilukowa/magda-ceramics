import { headers } from "next/headers";
import { getSession } from "@/lib/auth/dal";
import { checkoutService } from "@/lib/service/checkout";
import { paymentService } from "@/lib/service/payment";
import { canDraftOrderFor } from "@/lib/service/payment/helpers";
import {
  checkoutErrorResponse,
  draftOrderRequestSchema,
  getCartFingerprint,
  getRequestError,
} from "@/lib/service/checkout/helpers";
import { isRateLimited } from "@/lib/helpers/rateLimit";
import { CheckoutError } from "@/contracts/server/checkout";

// Każde żądanie zapisuje szkic w WooCommerce, więc z jednego miejsca nie może
// ich przyjść bez końca. Uczciwy klient klika „Zapłać" raz, najwyżej kilka
// razy po odrzuconej karcie.
const DRAFT_WINDOW_MS = 15 * 60 * 1000;
const DRAFT_LIMIT_PER_IP = 20;

// Zamówienie zapisane tuż PRZED płatnością i przypięte do niej w Stripe. Od tej
// chwili płatność sama wie, które zamówienie opłaca — domknie je strona
// potwierdzenia albo webhook, cokolwiek przyjdzie pierwsze. Patrz
// CheckoutService.saveDraftOrder.
export async function POST(request: Request) {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`checkout-draft:${ip}`, DRAFT_LIMIT_PER_IP, DRAFT_WINDOW_MS)) {
    return checkoutErrorResponse(CheckoutError.TooManyAttempts);
  }

  const body = await request.json().catch(() => null);
  const parsed = draftOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return checkoutErrorResponse(getRequestError(body));
  }

  const { billing, items, paymentIntentId, note, deliveryMethod, locker } =
    parsed.data;

  // Szkic wolno przypiąć wyłącznie do płatności, która czeka na klienta i którą
  // kasa wyceniła za dokładnie ten koszyk i ten kraj.
  const payment = await paymentService.getPayment(paymentIntentId);
  if (
    !payment ||
    !canDraftOrderFor(payment, getCartFingerprint(items), billing.country)
  ) {
    return checkoutErrorResponse(CheckoutError.PaymentNotVerified);
  }

  // Właściciela zamówienia bierzemy z sesji, nigdy z żądania.
  const session = await getSession();

  const result = await checkoutService.saveDraftOrder({
    billing,
    items,
    note,
    customerId: session?.customerId ?? null,
    deliveryMethod,
    locker,
  });
  if (!result.ok) {
    return checkoutErrorResponse(result.error);
  }

  try {
    await paymentService.attachOrder(payment.id, result.order);
  } catch (error) {
    // Bez przypięcia płatność nie wiedziałaby, co opłaca — dokładnie ta
    // dziura, którą ten szkic zamyka. Klient nie zapłaci, dopóki się nie uda.
    console.error("Stripe order attach failed:", error);
    return checkoutErrorResponse(CheckoutError.OrderFailed);
  }

  return Response.json({ ok: true });
}
