import { headers } from "next/headers";
import { z } from "zod";
import { orderService } from "@/lib/service/order";
import { checkoutService } from "@/lib/service/checkout";
import { isRateLimited } from "@/lib/helpers/rateLimit";
import { CancelReason, CancelResult } from "@/contracts/server/order";

const requestSchema = z.object({
  orderId: z.int().positive(),
  key: z.string().trim().min(1).max(100),
});

// Uczciwy klient anuluje raz. Limit chroni przed zgadywaniem kluczy.
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT_PER_IP = 20;

const reply = (result: CancelResult, status = 200) =>
  Response.json({ result }, { status });

// Klient anuluje swoje złożone, nieopłacone zamówienie (przycisk na stronie
// zamówienia, do której prowadzi link z maila). Zamiast logowania — numer
// i klucz zamówienia. Praca od razu wraca do sklepu.
export async function POST(request: Request) {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`order-cancel:${ip}`, LIMIT_PER_IP, WINDOW_MS)) {
    return reply(CancelResult.NotCancellable, 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return reply(CancelResult.NotCancellable, 400);

  const { orderId, key } = parsed.data;
  try {
    const order = await orderService.getOrderByKey(orderId, key);
    if (!order) return reply(CancelResult.NotCancellable, 404);
    return reply(await checkoutService.cancelUnpaidOrder(orderId, CancelReason.Customer));
  } catch (error) {
    // WordPress albo Stripe nie odpowiada — niczego nie anulowaliśmy.
    console.error(`Order ${orderId}: cancel failed:`, error);
    return reply(CancelResult.NotCancellable, 503);
  }
}
