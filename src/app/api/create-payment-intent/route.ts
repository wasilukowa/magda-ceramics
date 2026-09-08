import { checkoutService } from "@/lib/service/checkout";
import { paymentService } from "@/lib/service/payment";
import {
  checkoutErrorResponse,
  getRequestError,
  paymentIntentRequestSchema,
} from "@/lib/service/checkout/helpers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = paymentIntentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return checkoutErrorResponse(getRequestError(body));
  }

  const { items, country, currency } = parsed.data;

  // Kwota do zapłaty liczy się z cen wziętych z WooCommerce po numerze
  // produktu. Ceny przysłane przez przeglądarkę są ignorowane — wcześniej to
  // one o niej decydowały, więc żądanie z `price: "0.01"` kupowało wazon
  // za grosz.
  const pricing = await checkoutService.priceCart(items, country, currency);
  if (!pricing.ok) {
    return checkoutErrorResponse(pricing.error, pricing.unavailable);
  }

  const clientSecret = await paymentService.createIntent(pricing.cart, country);
  return Response.json({ clientSecret });
}
