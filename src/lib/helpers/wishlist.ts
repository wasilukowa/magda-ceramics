import { isCorrectNumber } from "@/utility";

// Lista ulubionych zapisana w pamięci przeglądarki. Trafić tam może wszystko:
// wpis sprzed przebudowy sklepu, ręczna poprawka w konsoli, resztka po innej
// witrynie na tym samym adresie w trakcie prac. Wcześniej `parsed.map(Number)`
// przepuszczał śmieci jako NaN, a taki NaN szedł potem na konto klienta.
export const parseStoredIds = (raw: string): number[] => {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<number>();
  return parsed.filter((value): value is number => {
    if (!isCorrectNumber(value) || !Number.isInteger(value) || value <= 0) {
      return false;
    }
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};
