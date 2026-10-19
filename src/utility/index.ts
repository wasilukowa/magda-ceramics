import type { PlacedCheckout } from "@/contracts/server/checkout";

export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isCorrectNumber = (value: unknown): value is number =>
  typeof value === "number" && !isNaN(value) && isFinite(value);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isObjectEmpty = (object: object): boolean =>
  Object.keys(object).length === 0;

// Numer telefonu „wygląda na prawdziwy": od 6 do 15 cyfr (15 to limit numeru
// międzynarodowego), plus dowolne spacje, myślniki, nawiasy i „+". Formatu
// kraju nie sprawdzamy — wystarczy, że nikt nie wpisze „-" albo „brak".
export const isPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, "").length;
  return /^[\d\s()+-]+$/.test(value.trim()) && digits >= 6 && digits <= 15;
};

// Adres e-mail „wygląda na prawdziwy": coś@coś.coś, bez spacji. Resztę
// sprawdza serwer, a ostatecznie skrzynka, do której przyjdzie mail.
export const isEmailAddress = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Odpowiedź „Złóż zamówienie" / „Zapisz zmiany" — w odróżnieniu od odmowy ma
// numer i klucz zamówienia.
export const isPlacedCheckout = (value: unknown): value is PlacedCheckout =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as PlacedCheckout).orderId === "number" &&
  typeof (value as PlacedCheckout).key === "string";
