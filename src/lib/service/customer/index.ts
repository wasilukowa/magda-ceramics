import "server-only";

import { HttpError, isNotFoundError, serverFetch } from "@/lib/api";
import {
  Customer,
  RawWcCustomer,
  SavedAddress,
  SavedLocker,
} from "@/contracts/server/auth";
import {
  ADDRESSES_META_KEY,
  LOCKERS_META_KEY,
  prepareCustomer,
  WISHLIST_META_KEY,
} from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

export type CustomerUpdate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

// Wszystkie operacje używają kluczy administracyjnych WooCommerce i są
// zawężone do konkretnego klienta przez warstwę DAL (verifySession).
class CustomerService {
  private static instance: CustomerService;
  private readonly authHeader: string;

  private constructor() {
    this.authHeader = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  }

  static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  private async wcFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await serverFetch(`${WP_URL}/wp-json/wc/v3/${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Basic ${this.authHeader}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
      cache: "no-store",
    } as RequestInit);
    if (!res.ok) throw new HttpError(res.status, `WooCommerce API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  // Null WYŁĄCZNIE wtedy, gdy WooCommerce mówi, że takiego klienta nie ma
  // (404 — np. konto usunięte w panelu). Awaria leci dalej: wcześniej
  // zamieniała się w „nie ma klienta", panel konta odsyłał do logowania,
  // logowanie przy ważnej sesji z powrotem do konta — i karta przeglądarki
  // kręciła się w kółko, aż się zawiesiła.
  async getCustomerById(id: number): Promise<Customer | null> {
    try {
      const raw = await this.wcFetch<RawWcCustomer>(`customers/${id}`);
      return prepareCustomer(raw);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    const results = await this.wcFetch<RawWcCustomer[]>(
      `customers?email=${encodeURIComponent(email)}`,
    );
    return results[0] ? prepareCustomer(results[0]) : null;
  }

  async updateCustomer(id: number, update: CustomerUpdate): Promise<Customer> {
    const body: Record<string, unknown> = {};
    if (update.firstName !== undefined) body.first_name = update.firstName;
    if (update.lastName !== undefined) body.last_name = update.lastName;
    if (update.email !== undefined) body.email = update.email;
    if (update.password !== undefined) body.password = update.password;

    const raw = await this.wcFetch<RawWcCustomer>(`customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return prepareCustomer(raw);
  }

  // Jedna wartość w danych klienta, zapisana w całości.
  private async setMeta(customerId: number, key: string, value: unknown): Promise<Customer> {
    const raw = await this.wcFetch<RawWcCustomer>(`customers/${customerId}`, {
      method: "PUT",
      body: JSON.stringify({ meta_data: [{ key, value }] }),
    });
    return prepareCustomer(raw);
  }

  async setWishlist(customerId: number, productIds: number[]): Promise<number[]> {
    const unique = Array.from(new Set(productIds.map(Number)));
    return (await this.setMeta(customerId, WISHLIST_META_KEY, unique)).wishlist;
  }

  // Zapisane adresy i paczkomaty — zawsze cała lista, najnowsze pierwsze.
  async setSavedAddresses(customerId: number, addresses: SavedAddress[]): Promise<Customer> {
    return this.setMeta(customerId, ADDRESSES_META_KEY, addresses);
  }

  async setSavedLockers(customerId: number, lockers: SavedLocker[]): Promise<Customer> {
    return this.setMeta(customerId, LOCKERS_META_KEY, lockers);
  }
}

export const customerService = CustomerService.getInstance();
