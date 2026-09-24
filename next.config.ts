import os from "node:os";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// `next dev` odsiewa żądania do /_next/*, które przychodzą z hosta innego niż
// ten, na którym wystartował (domyślnie localhost). Strona otwarta z telefonu
// po adresie LAN dostaje więc HTML i CSS, ale nie dostaje klienta Reacta:
// wygląda poprawnie i ŻADEN przycisk nie działa. Adresy tej maszyny liczymy
// tutaj, żeby nie trzeba było ich poprawiać po każdej zmianie adresu z DHCP.
// Ustawienie działa wyłącznie w trybie deweloperskim.
const lanHosts = Object.values(os.networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((iface) => iface.family === "IPv4" && !iface.internal)
  .map((iface) => iface.address);

// ─── Nagłówki bezpieczeństwa (Z8) ───────────────────────────────────────────
// Nonce'y w CSP wymuszają renderowanie każdej strony na żądanie, a sklep jest
// statyczny (cacheComponents) — więc idziemy wariantem „bez nonce'ów” z
// dokumentacji Next: skrypty inline dozwolone, bo Next sam wstrzykuje ich
// kilka do każdej strony. Reszta polityki i tak zamyka najczęstsze drogi:
// osadzenie sklepu w cudzej ramce, podmianę <base>, wysyłkę formularza na obcy
// adres, wtyczki <object>, ładowanie skryptów z niewymienionych domen.
//
// Zewnętrzni goście strony, i tylko oni:
// · Stripe — skrypt, ramki z polem karty i 3-D Secure, zapytania do API.
// · InPost — mapa paczkomatów: skrypt i arkusz z geowidget.inpost-group.com,
//   a sama mapa w ramce z geowidget-app.inpost-group.com (bez frame-src okno
//   „Wybierz paczkomat” jest puste — sprawdzone 2026-09-24).
const isDev = process.env.NODE_ENV === "development";

const STRIPE = ["https://js.stripe.com", "https://*.stripe.com"];
const INPOST = ["https://geowidget.inpost-group.com", "https://*.inpost-group.com"];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${[...STRIPE, ...INPOST].join(" ")}`,
  `style-src 'self' 'unsafe-inline' ${INPOST.join(" ")}`,
  `img-src 'self' data: blob: https://wp.magdaceramics.com ${[...STRIPE, ...INPOST].join(" ")}`,
  `font-src 'self' data: ${INPOST.join(" ")}`,
  `connect-src 'self' ${[...STRIPE, ...INPOST].join(" ")}`,
  `frame-src ${[...STRIPE, ...INPOST].join(" ")}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      'camera=(), microphone=(), usb=(), geolocation=(self), payment=(self "https://js.stripe.com")',
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Ile stron Next buduje NARAZ. Domyślnie osiem na workera, a workerów bywa
  // siedem — czyli kilkadziesiąt stron jednocześnie dobija się do WordPressa.
  // ZMIERZONE (czystym HTTP, bez udziału tego kodu): wp.magdaceramics.com
  // odpowiada bezbłędnie do 10 jednoczesnych zapytań, przy 15 pojawia się
  // pierwsze 500, a przy obciążeniu jak z builda (14 naraz, 90 zapytań)
  // sypie się co PIĄTE zapytanie. Błąd 500 jest gołą stroną Apache'a, nie
  // odpowiedzią WordPressa — to limit procesów PHP na serwerze, nie wina
  // WooCommerce. Jedynka trzyma nas pod tym progiem.
  // CENA: build lokalnie 14 s → 21 s. Tyle, ile trzeba.
  //
  // `staticGenerationRetryCount` powtarza stronę, która mimo to nie wyszła,
  // zamiast kłaść cały deploy. Domyślnie NIE MA żadnego ponowienia.
  //
  // ‼️ Oba ustawienia są w Next 16 „experimental" — przy podnoszeniu wersji
  // sprawdzić, czy nie zmieniły nazwy. Właściwym lekarstwem jest mocniejszy
  // hosting WordPressa; to jest ustępstwo z naszej strony, żeby deploy nie
  // zależał od kondycji cudzego serwera.
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationRetryCount: 2,
  },
  allowedDevOrigins: lanHosts,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "magdaceramics.com",
      },
      {
        protocol: "https",
        hostname: "wp.magdaceramics.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
