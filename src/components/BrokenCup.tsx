// Pęknięty kubek — zero w „404" (strona, której nie ma). Kreska jak
// w ikonach nagłówka, kolor bierze z `currentColor`.
export default function BrokenCup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* para */}
      <path d="M36 22c-5-5 5-9 0-15" />
      <path d="M50 22c-5-5 5-9 0-15" />
      {/* brzeg i brzuszek */}
      <ellipse cx="46" cy="34" rx="34" ry="7" />
      <path d="M12 34c0 36 4 64 14 70q20 6 40 0c10-6 14-34 14-70" />
      {/* ucho */}
      <path d="M79.5 48c19-2 21 30-5.5 36" />
      {/* pęknięcie */}
      <path d="M45 41l6 13-8 11 9 13-6 12 3 9" />
      {/* stół i odprysk na nim */}
      <path d="M4 112h92" />
      <path d="M84 111.5l6-5 2 5.5z" />
    </svg>
  );
}
