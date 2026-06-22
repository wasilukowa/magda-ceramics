import "server-only";

import { serverFetch } from "@/lib/api";
import {
  Customer,
  CustomerAddress,
  RawWcCustomer,
} from "@/contracts/server/auth";
import { OrderProps, RawOrder } from "@/contracts/server/order";
import { prepareCustomer, prepareOrder, WISHLIST_META_KEY } from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

export type CustomerUpdate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  billing?: CustomerAddress;
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
    if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    try {
      const raw = await this.wcFetch<RawWcCustomer>(`customers/${id}`);
      return prepareCustomer(raw);
    } catch {
      return null;
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
    if (update.billing) {
      body.billing = {
        first_name: update.billing.firstName,
        last_name: update.billing.lastName,
        phone: update.billing.phone,
        address_1: update.billing.street,
        city: update.billing.city,
        postcode: update.billing.postcode,
        country: update.billing.country,
      };
    }

    const raw = await this.wcFetch<RawWcCustomer>(`customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return prepareCustomer(raw);
  }

  async getOrders(customerId: number): Promise<OrderProps[]> {
    const raw = await this.wcFetch<RawOrder[]>(
      `orders?customer=${customerId}&per_page=50&orderby=date&order=desc`,
    );
    return raw.map(prepareOrder);
  }

  async setWishlist(customerId: number, productIds: number[]): Promise<number[]> {
    const unique = Array.from(new Set(productIds.map(Number)));
    const raw = await this.wcFetch<RawWcCustomer>(`customers/${customerId}`, {
      method: "PUT",
      body: JSON.stringify({
        meta_data: [{ key: WISHLIST_META_KEY, value: unique }],
      }),
    });
    return prepareCustomer(raw).wishlist;
  }
}

export const customerService = CustomerService.getInstance();
