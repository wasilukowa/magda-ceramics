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

// Dolicza jedną próbę pod danym kluczem i zwraca, ile ich już jest.
export const recordAttempt = (key: string, windowMs: number): number => {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > 500) dropExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }

  bucket.count += 1;
  return bucket.count;
};

// Czy zapisano już tyle prób, ile wolno — BEZ doliczania kolejnej. W obu
// funkcjach `limit` znaczy to samo: tyle prób przechodzi, następna jest
// odrzucana.
//
// Rozdzielenie odczytu od zapisu jest tu po coś: przy logowaniu liczymy
// wyłącznie próby NIEUDANE. Gdyby liczyła się każda, to za jednym adresem IP
// — biuro, sieć komórkowa, kawiarnia — klienci logujący się poprawnie
// spychaliby się nawzajem w blokadę, choć nikt niczego nie zgaduje.
export const hasExceededLimit = (key: string, limit: number): boolean => {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= Date.now()) return false;
  return bucket.count >= limit;
};

// Zwraca true, gdy limit został PRZEKROCZONY (czyli żądanie należy odrzucić).
// Liczy każde wywołanie, więc nadaje się tam, gdzie kosztuje samo pytanie:
// wysyłka maila, założenie konta.
export const isRateLimited = (
  key: string,
  limit: number,
  windowMs: number,
): boolean => recordAttempt(key, windowMs) > limit;
