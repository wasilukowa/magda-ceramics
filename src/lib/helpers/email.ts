// Adresy z jednej zmiennej środowiskowej, oddzielone przecinkiem.
export const parseEmails = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
