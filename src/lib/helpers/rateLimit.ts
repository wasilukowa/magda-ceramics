import "server-only";

// Prosty licznik w pamięci procesu. NIE jest to twarda gwarancja: na Vercelu
// żyje tyle liczników, ile instancji funkcji akurat obsługuje ruch, a po
// uśpieniu instancji zaczynają od zera. Wystarczy jednak do tego, po co tu
// stoi — żeby jeden formularz nie dał się kliknąć w kółko i zasypać czyjejś
// skrzynki (albo limitu Resenda) wiadomościami.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Sprzątanie przy okazji zapisu — bez tego mapa rosłaby w nieskończoność
// przy losowych kluczach (adres e-mail bywa zmyślony).
const dropExpired = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

// Zwraca true, gdy limit został PRZEKROCZONY (czyli żądanie należy odrzucić).
export const isRateLimited = (
  key: string,
  limit: number,
  windowMs: number,
): boolean => {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > 500) dropExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
};
