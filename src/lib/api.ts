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
