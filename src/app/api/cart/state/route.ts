import { z } from "zod";
import { checkoutService } from "@/lib/service/checkout";

// Numery produktów z koszyka. Trzydzieści to ten sam sufit, co w kasie —
// pracownia sprzedaje pojedyncze sztuki, nikt uczciwy się o niego nie obije.
const requestSchema = z.object({
  ids: z.array(z.int().positive()).min(1).max(30),
});

// Koszyk pyta o świeże ceny i dostępność, gdy klient go otwiera. To odczyt,
// więc niepowodzenie nie jest tu niczym dramatycznym — koszyk zostaje wtedy
// z tym, co pamięta.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ items: [] }, { status: 400 });
  }

  const unique = Array.from(new Set(parsed.data.ids));
  return Response.json({ items: await checkoutService.getCartState(unique) });
}
