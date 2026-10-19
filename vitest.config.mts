import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testy logiki sklepu: czyste funkcje z lib/ i utility/ (ceny, wysyłka,
// zamówienia, płatności, zabezpieczenia). Bez przeglądarki i bez
// WooCommerce — `npm test`. Testy klikające po sklepie są w e2e/ (Playwright).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Poza Nextem „server-only" rzuca błąd przy imporcie — w testach to
      // zwykły moduł serwerowy.
      "server-only": fileURLToPath(
        new URL("./node_modules/next/dist/compiled/server-only/empty.js", import.meta.url)
      ),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
