import "server-only";

import { HttpError, serverFetch } from "@/lib/api";
import { Customer, RawWcCustomer } from "@/contracts/server/auth";
import { prepareCustomer } from "@/lib/service/customer/helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;
// Endpoint logowania wtyczki Simple JWT Login (sprawdza hasło klienta).
const WP_AUTH_ENDPOINT =
  process.env.WP_AUTH_ENDPOINT ??
  `${WP_URL}/wp-json/simple-jwt-login/v1/auth`;

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export class EmailExistsError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "EmailExistsError";
  }
}

// Logika biznesowa auth: weryfikacja hasła w WordPressie + rejestracja klienta
// w WooCommerce. Sesją zarządza warstwa lib/auth/session.
class AuthService {
  private static instance: AuthService;
  private readonly authHeader: string;

  private constructor() {
    this.authHeader = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // True, gdy WordPress potwierdzi parę e-mail + hasło; false, gdy ją
  // odrzuci (odpowiedź 4xx). Awaria — błąd 5xx, zerwane połączenie, limit
  // czasu — leci dalej jako wyjątek. Wcześniej też dawała false, więc przy
  // leżącym WordPressie klient z dobrym hasłem czytał „nieprawidłowy e-mail
  // lub hasło", a każda taka próba liczyła się do limitu i po kilku
  // zamykała mu logowanie na kwadrans.
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const res = await serverFetch(WP_AUTH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) return true;
    if (res.status < 500) return false;
    throw new HttpError(res.status, `WordPress auth error: ${res.status}`);
  }

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    const res = await serverFetch(
      `${WP_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Basic ${this.authHeader}` } },
    );
    if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
    const results = (await res.json()) as RawWcCustomer[];
    return results[0] ? prepareCustomer(results[0]) : null;
  }

  // Tworzy klienta WooCommerce (= użytkownik WordPressa z rolą "customer").
  async register(input: RegisterInput): Promise<Customer> {
    const res = await serverFetch(`${WP_URL}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        first_name: input.firstName,
        last_name: input.lastName,
        billing: { first_name: input.firstName, last_name: input.lastName },
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        code?: string;
      } | null;
      if (
        res.status === 400 &&
        body?.code &&
        body.code.includes("email")
      ) {
        throw new EmailExistsError();
      }
      throw new Error(`WooCommerce register error: ${res.status}`);
    }

    return prepareCustomer((await res.json()) as RawWcCustomer);
  }
}

export const authService = AuthService.getInstance();
