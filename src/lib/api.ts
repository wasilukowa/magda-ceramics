export const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

const TIMEOUT_MS = 10_000;

// Limit czasu jest tu po to, żeby zawieszony WordPress nie zawiesił naszej
// strony — więc nie może dać się przypadkiem wyłączyć. Wcześniej `signal` stał
// przed `...options` i własny sygnał wywołującego po cichu go kasował. Teraz
// oba sygnały działają razem: limit obowiązuje zawsze, a wywołujący nadal może
// przerwać żądanie po swojemu.
export const serverFetch = (url: string, options?: RequestInit) => {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);

  return fetch(url, {
    ...options,
    signal: options?.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout,
  });
};

const RETRY_DELAY_MS = 750;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Jedno ponowienie — WYŁĄCZNIE dla zapytań, które tylko czytają. Serwer WP
// pracowni pod obciążeniem builda oddaje czasem gołe 500 z Apache'a albo nie
// odpowiada w ogóle, a to samo zapytanie chwilę później przechodzi (patrz
// reference-wp-hosting w notatkach). Bez ponowienia jedno takie potknięcie
// kładzie cały deploy.
// Ponawiamy tylko błąd sieci, limit czasu i odpowiedzi 5xx; 4xx (zły klucz,
// brak zasobu) za drugim razem wyglądałoby tak samo. Zapisów (POST/PUT) NIE
// wolno tędy puszczać: drugie złożenie zamówienia to drugie zamówienie.
// CENA: przy prawdziwej awarii WP odpowiedź przychodzi później — najgorzej
// dwa limity czasu plus przerwa, ok. 21 s zamiast 10 s.
export const serverFetchReadWithRetry = async (
  url: string,
  options?: Omit<RequestInit, "method" | "body">
): Promise<Response> => {
  try {
    const res = await serverFetch(url, options);
    if (res.status < 500) return res;
  } catch (error) {
    if (options?.signal?.aborted) throw error;
  }

  await wait(RETRY_DELAY_MS);
  return serverFetch(url, options);
};
