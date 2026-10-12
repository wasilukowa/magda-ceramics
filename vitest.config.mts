import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testy logiki sklepu: czyste funkcje z lib/ i utility/ (ceny, wysyłka,
// zamówienia). Bez przeglądarki i bez WooCommerce — `npm test`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
