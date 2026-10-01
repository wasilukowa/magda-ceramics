import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth/dal";
import { orderService } from "@/lib/service/order";
import { customerMailService } from "@/lib/service/customerMail";
import { paymentService } from "@/lib/service/payment";
import { isPaymentForOrder } from "@/lib/service/payment/helpers";
import { OrderConfirmResult } from "@/contracts/server/order";

const requestSchema = z.object({
  orderId: z.int().positive(),
  paymentIntentId: z.string().trim().min(1).max(255),
});

const reply = (result: OrderConfirmResult, status = 200) =>
  Response.json({ result }, { status });

// Domknięcie zapłaty za zamówienie, które istniało wcześniej. O tym, czy
// pieniądze wpłynęły, decyduje wyłącznie Stripe — numer płatności z adresu
// mówi tylko, KTÓRĄ płatność sprawdzić.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return reply(OrderConfirmResult.NotConfirmed, 400);

  // Cudzego zamówienia nie da się domknąć: właściciela bierzemy z sesji,
  // nigdy z żądania.
  const { orderId, paymentIntentId } = parsed.data;
  let customer;
  let order;
  try {
    customer = await getCurrentCustomer();
    order = customer
      ? await orderService.getCustomerOrder(customer.id, orderId)
      : null;
  } catch (error) {
    // WordPress nie odpowiada — nie da się sprawdzić, czyje to zamówienie.
    // Zapłatę i tak zapisze webhook; klient dostaje „nie potwierdzono".
    console.error(`Order ${orderId}: confirm lookup failed:`, error);
    return reply(OrderConfirmResult.NotConfirmed, 503);
  }
  if (!customer) return reply(OrderConfirmResult.NotConfirmed, 401);
  if (!order) return reply(OrderConfirmResult.NotConfirmed, 404);

  // Zamówienie, które i tak nie czekało już na pieniądze, jest opłacone —
  // np. gdy klient odświeżył tę stronę.
  if (!order.payable) return reply(OrderConfirmResult.Paid);

  const payment = await paymentService.getPayment(paymentIntentId);
  if (!payment || !isPaymentForOrder(payment, orderId)) {
    return reply(OrderConfirmResult.NotConfirmed, 402);
  }

  // Z webhookiem to on zapisuje zapłatę — tu wystarczy, że Stripe ją
  // potwierdził. Zapis z dwóch miejsc naraz dublował maile i magazyn (#282).
  if (paymentService.isWebhookConfigured()) return reply(OrderConfirmResult.Paid);

  try {
    await orderService.markPaid(orderId, order.status, payment);
    await customerMailService.sendConfirmation(orderId);
  } catch (error) {
    // Pieniądze są u Stripe'a, więc klientowi mówimy prawdę: zapłacono.
    // Rozjazd w WooCommerce zostaje w logu dla Magdy.
    console.error(`Order ${orderId}: paid but not marked in WooCommerce:`, error);
    return reply(OrderConfirmResult.PaidNotRecorded);
  }

  return reply(OrderConfirmResult.Paid);
}
