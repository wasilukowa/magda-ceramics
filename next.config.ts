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

const nextConfig: NextConfig = {
  cacheComponents: true,

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
