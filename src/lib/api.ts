export const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const serverFetch = (url: string, options?: RequestInit) =>
  fetch(url, {
    signal: AbortSignal.timeout(10_000),
    ...options,
  });
