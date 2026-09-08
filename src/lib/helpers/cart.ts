import { CartItem, CartItemState } from "@/contracts/server/cart";
import { isCorrectNumber, isString } from "@/utility";

// Koszyk siedzi w pamięci przeglądarki, a tam trafić może wszystko: wpis
// sprzed przebudowy sklepu, ręczna poprawka w konsoli, resztka po innej
// witrynie na tym samym adresie w trakcie prac. Bez sprawdzenia taki wpis
// dochodził aż do podsumowania i pokazywał się jako „NaN zł".
const isCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;

  return (
    isCorrectNumber(item.id) &&
    Number.isInteger(item.id) &&
    item.id > 0 &&
    isString(item.slug) &&
    isString(item.name) &&
    isString(item.price) &&
    Number.isFinite(parseFloat(item.price)) &&
    (item.priceEur === null || isCorrectNumber(item.priceEur)) &&
    isString(item.image) &&
    isCorrectNumber(item.quantity) &&
    item.quantity > 0
  );
};

// Zapisany koszyk zamieniony na coś, czemu można zaufać. Wpisy nie do
// odczytania po prostu odpadają — reszta koszyka zostaje, bo wyrzucenie
// wszystkiego przez jedną zepsutą pozycję byłoby dla klienta gorsze.
// Ceramika to pojedyncze sztuki, więc ten sam produkt może być w koszyku
// tylko raz; duplikaty (gdyby powstały) redukujemy, zamiast je sumować.
export const parseStoredCart = (raw: string): CartItem[] => {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<number>();
  return parsed.filter((entry): entry is CartItem => {
    if (!isCartItem(entry) || seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
};

// Świeży stan pozycji koszyka prosto z WooCommerce. Zerwane połączenie zwraca
// pustą listę — koszyk zostaje wtedy taki, jaki był, bo lepiej pokazać
// wczorajszą cenę niż pusty koszyk przez czkawkę serwera.
export const fetchCartState = async (
  ids: number[]
): Promise<CartItemState[]> => {
  if (ids.length === 0) return [];

  try {
    const res = await fetch("/api/cart/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { items?: CartItemState[] };
    return data.items ?? [];
  } catch {
    return [];
  }
};
