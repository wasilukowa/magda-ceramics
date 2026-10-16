import "server-only";

import { createHmac } from "crypto";
import { Redis } from "@upstash/redis";

// Liczniki prób trzymamy we wspólnej bazie Redis (Upstash, podpięty przez
// Vercel Marketplace). Wcześniej żyły w pamięci procesu i test Z11 na
// produkcji (16.10.2026) pokazał, czym to grozi: Vercel obsługuje ruch kilkoma
// instancjami naraz, każda miała własny licznik, więc konto zablokowane po
// pięciu złych hasłach w jednej instancji logowało się bez przeszkód w drugiej.
//
// Licznik w pamięci zostaje jako zapas: gdy bazy nie ma (lokalnie bez
// zmiennych) albo nie odpowiada. Wtedy zapora działa tak jak przedtem —
// słabiej, ale nikt nie zostaje odcięty od logowania przez awarię Redisa.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Baza nie może zatrzymać logowania ani wysyłki formularza. Jedna szybka
// próba ponowienia, a po sekundzie bez odpowiedzi — licznik w pamięci.
const REDIS_TIMEOUT_MS = 1_000;

let redis: Redis | null | undefined;

const getRedis = (): Redis | null => {
  if (redis !== undefined) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  redis =
    url && token
      ? new Redis({
          url,
          token,
          retry: { retries: 1 },
          signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
        })
      : null;
  return redis;
};

// W kluczach siedzą adresy e-mail i IP, a baza stoi u zewnętrznej firmy —
// więc zamiast nich zapisujemy podpisany skrót. Przedrostek środowiska
// oddziela produkcję od podglądów i lokalnych testów: zablokowanie konta przy
// teście na podglądzie nie zamyka go w sklepie.
const toRedisKey = (key: string): string => {
  const digest = createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(`rate-limit:${key}`)
    .digest("base64url");
  return `rl:${process.env.VERCEL_ENV ?? "development"}:${digest}`;
};

// Sprzątanie przy okazji zapisu — bez tego mapa rosłaby w nieskończoność
// przy losowych kluczach (adres e-mail bywa zmyślony).
const dropExpired = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

const recordInMemory = (key: string, windowMs: number): number => {
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

const countInMemory = (key: string): number => {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= Date.now()) return 0;
  return bucket.count;
};

// Dolicza jedną próbę pod danym kluczem i zwraca, ile ich już jest.
// Okno liczy się od pierwszej próby (NX: kolejne nie przesuwają terminu),
// a doliczenie i termin idą jedną transakcją — klucz nie zostanie bez
// terminu, więc nie zablokuje nikogo na zawsze.
export const recordAttempt = async (
  key: string,
  windowMs: number,
): Promise<number> => {
  const client = getRedis();
  if (client) {
    try {
      const redisKey = toRedisKey(key);
      const [count] = await client
        .multi()
        .incr(redisKey)
        .pexpire(redisKey, windowMs, "NX")
        .exec();
      return count;
    } catch (error) {
      console.error("Rate limit: Redis unavailable, using memory", error);
    }
  }
  return recordInMemory(key, windowMs);
};

// Czy zapisano już tyle prób, ile wolno — BEZ doliczania kolejnej. W obu
// funkcjach `limit` znaczy to samo: tyle prób przechodzi, następna jest
// odrzucana.
//
// Rozdzielenie odczytu od zapisu jest tu po coś: przy logowaniu liczymy
// wyłącznie próby NIEUDANE. Gdyby liczyła się każda, to za jednym adresem IP
// — biuro, sieć komórkowa, kawiarnia — klienci logujący się poprawnie
// spychaliby się nawzajem w blokadę, choć nikt niczego nie zgaduje.
export const hasExceededLimit = async (
  key: string,
  limit: number,
): Promise<boolean> => {
  const client = getRedis();
  if (client) {
    try {
      const count = await client.get<number>(toRedisKey(key));
      return Number(count ?? 0) >= limit;
    } catch (error) {
      console.error("Rate limit: Redis unavailable, using memory", error);
    }
  }
  return countInMemory(key) >= limit;
};

// Zwraca true, gdy limit został PRZEKROCZONY (czyli żądanie należy odrzucić).
// Liczy każde wywołanie, więc nadaje się tam, gdzie kosztuje samo pytanie:
// wysyłka maila, założenie konta.
export const isRateLimited = async (
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> => (await recordAttempt(key, windowMs)) > limit;
