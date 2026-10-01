const WARSAW_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Dzień w polskim kalendarzu, YYYY-MM-DD. Serwer liczy w UTC, a zapłata
// o 0:30 w nocy to w Polsce już następny dzień.
export const getWarsawDay = (date: Date): string => WARSAW_DAY.format(date);

// Dzień przesunięty o `days`. Liczone na samej dacie w UTC, więc zmiana
// czasu letniego niczego nie przesuwa.
export const shiftDay = (day: string, days: number): string => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// „2026-09-30" → „30.09.2026".
export const formatDayPl = (day: string): string =>
  day.split("-").reverse().join(".");

// WooCommerce podaje daty *_gmt bez oznaczenia strefy („2026-09-25T10:00:00").
// Bez dopisanego „Z" JavaScript wziąłby je za czas lokalny serwera.
export const parseWooGmtDate = (value: string): Date =>
  new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`);

const PL_MONTH = new Intl.DateTimeFormat("pl-PL", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// „2026-09" → „wrzesień 2026".
export const formatMonthPl = (month: string): string =>
  PL_MONTH.format(new Date(`${month}-01T12:00:00Z`));

