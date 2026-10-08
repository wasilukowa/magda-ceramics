import { reservationService } from "@/lib/service/reservation";

// Przypomnienia o zapłacie i anulowanie zamówień po terminie — patrz
// ReservationService. Woła to co godzinę zewnętrzny budzik, a raz na dobę
// także Vercel Cron (zapas). Obaj wysyłają nagłówek
// `authorization: Bearer <CRON_SECRET>`; bez CRON_SECRET trasa nie robi nic,
// żeby publiczny adres nie mógł rozsyłać maili ani anulować zamówień na
// żądanie kogokolwiek z internetu.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Unpaid orders: missing CRON_SECRET env var");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    return Response.json(await reservationService.run());
  } catch (error) {
    console.error("Unpaid orders: WooCommerce lookup failed:", error);
    return Response.json({ error: "lookup failed" }, { status: 503 });
  }
}
