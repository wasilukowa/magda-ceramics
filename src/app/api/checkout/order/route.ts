import { headers } from "next/headers";
import { getSession } from "@/lib/auth/dal";
import { checkoutService } from "@/lib/service/checkout";
import {
  checkoutErrorResponse,
  getRequestError,
  placeOrderRequestSchema,
  updateOrderRequestSchema,
} from "@/lib/service/checkout/helpers";
import { isRateLimited } from "@/lib/helpers/rateLimit";
import { resolveDeliveryMethod } from "@/lib/helpers/shipping";
import { CheckoutError } from "@/contracts/server/checkout";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";

// Każde żądanie zapisuje zamówienie w WooCommerce, więc z jednego miejsca nie
// może ich przyjść bez końca. Uczciwy klient klika raz, najwyżej kilka razy.
const DRAFT_WINDOW_MS = 15 * 60 * 1000;
const DRAFT_LIMIT_PER_IP = 20;

const isTooFrequent = async (): Promise<boolean> => {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return isRateLimited(`checkout-draft:${ip}`, DRAFT_LIMIT_PER_IP, DRAFT_WINDOW_MS);
};

// Paczkomat tylko z wybranym punktem i tylko tam, gdzie InPost dowozi.
const getDelivery = (
  country: string,
  requested: DeliveryMethod | undefined,
  locker: InPostPoint | null | undefined
) => {
  const deliveryMethod = resolveDeliveryMethod(country, requested, !!locker);
  return {
    deliveryMethod,
    locker: deliveryMethod === DeliveryMethod.Locker ? locker : null,
  };
};

// „Złóż zamówienie" — koniec kroku „Wysyłka" (decyzja Natalii 2026-10-12).
// Zamówienie od tej chwili istnieje, a praca czeka na klienta 48 h. W
// odpowiedzi idzie płatność w Stripe dla kroku „Płatność" — założona DLA tego
// zamówienia, więc domknie je webhook, choćby klient nie wrócił do tej karty.
// Patrz CheckoutService.placeOrder.
export async function POST(request: Request) {
  if (await isTooFrequent()) {
    return checkoutErrorResponse(CheckoutError.TooManyAttempts);
  }

  const body = await request.json().catch(() => null);
  const parsed = placeOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return checkoutErrorResponse(getRequestError(body));
  }

  const { billing, items, note, locale, currency, checkoutId } = parsed.data;

  // Właściciela zamówienia bierzemy z sesji, nigdy z żądania.
  const session = await getSession();

  const result = await checkoutService.placeOrder({
    billing,
    items,
    note,
    customerId: session?.customerId ?? null,
    ...getDelivery(billing.country, parsed.data.deliveryMethod, parsed.data.locker),
    locale,
    currency,
    checkoutId,
  });
  if (!result.ok) {
    return checkoutErrorResponse(result.error, result.unavailable);
  }

  return Response.json(await checkoutService.getPlacedCheckout(result.order));
}

// „Zapisz zmiany" — poprawka złożonego, nieopłaconego zamówienia po „Wstecz"
// z kroku „Płatność". Gdy zmieni się kwota, płatność w Stripe zostaje
// wymieniona na nową. Patrz CheckoutService.updatePlacedOrder.
export async function PATCH(request: Request) {
  if (await isTooFrequent()) {
    return checkoutErrorResponse(CheckoutError.TooManyAttempts);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return checkoutErrorResponse(CheckoutError.InvalidCart);
  }

  const { orderId, key, billing, note } = parsed.data;
  const result = await checkoutService.updatePlacedOrder({
    orderId,
    key,
    billing,
    note,
    ...getDelivery(billing.country, parsed.data.deliveryMethod, parsed.data.locker),
  });
  if (!result.ok) {
    return checkoutErrorResponse(result.error, result.unavailable);
  }

  return Response.json(await checkoutService.getPlacedCheckout(result.order));
}
