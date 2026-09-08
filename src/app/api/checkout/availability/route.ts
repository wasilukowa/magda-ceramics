import { checkoutService } from "@/lib/service/checkout";
import {
  availabilityRequestSchema,
  checkoutErrorResponse,
  getRequestError,
} from "@/lib/service/checkout/helpers";

// Ostatnie spojrzenie na magazyn tuż przed zapłatą. Ceramika to pojedyncze
// sztuki, a klient potrafi siedzieć w kasie kilkanaście minut — bez tego
// sprawdzenia dwie osoby płacą za tę samą pracę i dowiadują się o tym dopiero
// od Magdy.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = availabilityRequestSchema.safeParse(body);

  if (!parsed.success) {
    return checkoutErrorResponse(getRequestError(body));
  }

  const availability = await checkoutService.getAvailability(parsed.data.items);
  if (!availability.ok) {
    return checkoutErrorResponse(availability.error, availability.unavailable);
  }

  return Response.json({ ok: true });
}
