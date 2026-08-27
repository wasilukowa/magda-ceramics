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
