const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// Tekst, który nie pochodzi od nas (imię, adres, uwaga klienta, notatka
// Magdy), wstawiany do HTML-a maila. Bez tego „<" w uwadze rozsypałoby układ —
// albo wstawiło do maila cudzy kod.
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
