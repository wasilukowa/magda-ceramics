import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Testy klikające po sklepie jak klient (`npm run test:e2e`). Idą na lokalny
// serwer z kluczami z .env.local: testowy Stripe, ale PRAWDZIWY WooCommerce
// Magdy — innego nie ma. Dlatego zwykłe testy niczego nie zamawiają;
// zamówienia składa tylko osobny zestaw `npm run test:e2e:orders`
// (e2e/orders.spec.ts), który po sobie je anuluje.
loadEnvConfig(process.cwd());

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Maile z testowych zamówień idą na skrzynkę testową Resenda, nie do
// pracowni — zmienna z powłoki wygrywa z .env.local.
const TEST_INBOX = "delivered@resend.dev";

export default defineConfig({
  testDir: "e2e",
  // Jeden WooCommerce dla wszystkich testów, a serwer WP łamie się przy
  // kilkunastu zapytaniach naraz — testy idą po kolei.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: BASE_URL + "/coming-soon",
    // Zamówienia zawsze na świeżym serwerze z mailami na skrzynkę testową —
    // cudzy serwer na tym porcie mógłby wysłać je do pracowni.
    reuseExistingServer: !process.env.E2E_ORDERS,
    timeout: 10 * 60_000,
    env: {
      CONTACT_RECIPIENT_EMAIL: TEST_INBOX,
      CONTACT_BCC_EMAIL: TEST_INBOX,
    },
  },
});
