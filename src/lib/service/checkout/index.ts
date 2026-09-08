import "server-only";

import { serverFetch } from "@/lib/api";
import { CartItemState, OrderItem } from "@/contracts/server/cart";
import { ProductProps, RawProduct } from "@/contracts/server/product";
import { RawPlacedOrder } from "@/contracts/server/order";
import {
  AvailabilityResult,
  CartPricingResult,
  CheckoutError,
  CheckoutFailure,
  PlaceOrderInput,
  PlaceOrderResult,
  PricedLine,
  UnavailableItem,
} from "@/contracts/server/checkout";
import { PaymentStatus } from "@/contracts/server/payment";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { prepareProduct } from "@/lib/service/product/helpers";
import { EXCHANGE_RATE_PLN_PER_EUR, getUnitPrice } from "@/lib/helpers/currency";
import { getShippingAmount, getShippingCostInZloty } from "@/lib/helpers/shipping";
import { getCartFingerprint, getUnavailableItems } from "./helpers";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

// Wszystko, co w kasie dotyczy pieniędzy i dostępności, liczy się tutaj — nie
// w trasie API i tym bardziej nie w przeglądarce. Zasada jest jedna: z żądania
// bierzemy wyłącznie numery produktów i liczbę sztuk, całą resztę (cenę, stan
// magazynowy) czytamy z WooCommerce.
class CheckoutService {
  private static instance: CheckoutService;
  private readonly authHeader: string;

  private constructor() {
    this.authHeader = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  }

  static getInstance(): CheckoutService {
    if (!CheckoutService.instance) {
      CheckoutService.instance = new CheckoutService();
    }
    return CheckoutService.instance;
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
    });
    if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  // Świeże dane prosto z WooCommerce, świadomie z pominięciem cache'u katalogu
  // (ProductService trzyma go przez minutę). Przy oglądaniu sklepu minuta
  // opóźnienia nic nie znaczy, przy płatności decyduje o cenie i o tym, czy
  // praca jest jeszcze do kupienia.
  private async getLiveProducts(ids: number[]): Promise<ProductProps[]> {
    const raw = await this.wcFetch<RawProduct[]>(
      `products?include=${ids.join(",")}&per_page=${ids.length}`
    );
    return raw.map(prepareProduct);
  }

  // Świeże produkty z koszyka, o ile wszystkie da się jeszcze kupić. Jedno
  // miejsce dla obu pytań, jakie zadaje kasa: „czy wolno" i „za ile".
  private async getPurchasableProducts(
    items: OrderItem[]
  ): Promise<{ ok: true; products: ProductProps[] } | CheckoutFailure> {
    let products: ProductProps[];
    try {
      products = await this.getLiveProducts(items.map((item) => item.id));
    } catch (error) {
      console.error("Checkout catalog lookup failed:", error);
      return {
        ok: false,
        error: CheckoutError.CatalogUnavailable,
        unavailable: [],
      };
    }

    const unavailable = getUnavailableItems(items, products);
    return unavailable.length
      ? { ok: false, error: CheckoutError.Unavailable, unavailable }
      : { ok: true, products };
  }

  // Czy koszyk da się jeszcze kupić. Sprawdzane tuż przed zapłatą — ceramika to
  // pojedyncze sztuki, więc ktoś mógł kupić tę samą pracę, kiedy klient
  // wypełniał adres.
  async getAvailability(items: OrderItem[]): Promise<AvailabilityResult> {
    const result = await this.getPurchasableProducts(items);
    return result.ok ? { ok: true } : result;
  }

  // Stan pozycji koszyka na teraz: aktualna nazwa, aktualna cena i to, czy
  // pracę wciąż da się kupić. Koszyk w przeglądarce pamięta wartości z chwili
  // dodania — po tygodniu potrafią się rozjechać z rzeczywistością.
  async getCartState(ids: number[]): Promise<CartItemState[]> {
    if (ids.length === 0) return [];

    let products: ProductProps[];
    try {
      products = await this.getLiveProducts(ids);
    } catch (error) {
      console.error("Cart state lookup failed:", error);
      return [];
    }

    const byId = new Map(products.map((product) => [product.id, product]));

    return ids.flatMap((id) => {
      const product = byId.get(id);
      // Produkt zniknął z WooCommerce — koszyk sam się o tym dowie po tym, że
      // nie ma go w odpowiedzi.
      if (!product) {
        return [{ id, name: "", price: "", priceEur: null, purchasable: false }];
      }

      return [
        {
          id,
          name: product.name,
          price: product.price,
          priceEur: product.priceEur,
          purchasable: product.hasPrice && product.inStock,
        },
      ];
    });
  }

  // Ile naprawdę kosztuje ten koszyk. Ceny biorą się z WooCommerce po numerze
  // produktu, wysyłka ze strefy kraju — nic z tego nie przychodzi z żądania.
  async priceCart(
    items: OrderItem[],
    country: string,
    currency: Currency
  ): Promise<CartPricingResult> {
    const result = await this.getPurchasableProducts(items);
    if (!result.ok) return result;

    const { products } = result;

    const byId = new Map(products.map((product) => [product.id, product]));
    const lines: PricedLine[] = items.map((item) => {
      const product = byId.get(item.id)!;
      const unitAmount = Math.round(getUnitPrice(product, currency) * 100);
      return {
        id: item.id,
        quantity: item.quantity,
        unitAmount,
        amount: unitAmount * item.quantity,
      };
    });

    const productsAmount = lines.reduce((sum, line) => sum + line.amount, 0);
    const shippingAmount = getShippingAmount(country, currency);

    return {
      ok: true,
      cart: {
        currency,
        lines,
        productsAmount,
        shippingAmount,
        total: productsAmount + shippingAmount,
        fingerprint: getCartFingerprint(items),
      },
    };
  }

  // Prace, które zdążyły się sprzedać, zanim zamówienie doszło do skutku.
  // Niedostępny WooCommerce nie liczy się jako konflikt — to nie jest moment
  // na zgadywanie, a i tak jest już po płatności.
  private async getSoldOutConflicts(
    items: OrderItem[]
  ): Promise<UnavailableItem[]> {
    const availability = await this.getAvailability(items);
    return availability.ok ? [] : availability.unavailable;
  }

  // Zamówienie powstaje dopiero wtedy, gdy Stripe potwierdził płatność — to
  // sprawdza trasa API. Tutaj jest już tylko zapis do WooCommerce.
  async placeOrder({
    billing,
    items,
    note,
    payment,
    deliveryMethod,
    locker,
  }: PlaceOrderInput): Promise<PlaceOrderResult> {
    // Wysyłkę liczymy z kraju adresu, nie z tego, co przyszło w żądaniu — a że
    // ten sam kraj musiał być użyty przy płatności (metadane w Stripe), suma
    // zamówienia zgadza się z tym, co klient naprawdę zapłacił.
    const shippingTotal = getShippingCostInZloty(billing.country);

    // Parcel-locker orders (Poland + InPost International countries): ship to
    // the locker's address and label the shipping line with the locker code so
    // the studio knows where to send it.
    const isLocker = deliveryMethod === DeliveryMethod.Locker && !!locker;
    const shipping = isLocker
      ? {
          ...billing,
          company: `Paczkomat ${locker!.code}`,
          address_1: locker!.description || locker!.code,
          city: locker!.city,
          postcode: locker!.postCode,
        }
      : billing;
    const shippingTitle = isLocker
      ? `Paczkomat InPost ${locker!.code}`
      : "Shipping";

    const conflicts = await this.getSoldOutConflicts(items);

    // Metody odroczone (Klarna) odsyłają klienta do sklepu, zanim Stripe
    // potwierdzi przelew. Takie zamówienie powstaje wstrzymane i nieopłacone —
    // fałszywe „opłacone" byłoby gorsze niż czekanie, a brak zamówienia
    // najgorszy ze wszystkiego.
    const isPaid = payment.status === PaymentStatus.Succeeded;

    // Orders are always recorded in the PLN store currency. When the customer
    // paid in EUR, record the actual charged amount + rate so the studio can
    // reconcile it against Stripe.
    const paidInEur = payment.currency === Currency.EUR;
    const metaData = [
      { key: "_stripe_payment_intent", value: payment.id },
      { key: "_stripe_payment_status", value: payment.status },
      ...(isLocker
        ? [{ key: "_inpost_locker_id", value: locker!.code }]
        : []),
      ...(paidInEur
        ? [
            { key: "_paid_currency", value: "EUR" },
            { key: "_paid_amount", value: payment.paidTotal.toFixed(2) },
            { key: "_exchange_rate", value: EXCHANGE_RATE_PLN_PER_EUR.toString() },
          ]
        : []),
      ...(conflicts.length
        ? [{ key: "_stock_conflict", value: conflicts.map((c) => c.id).join(",") }]
        : []),
    ];

    const noteParts: string[] = [];
    if (note) noteParts.push(note);
    if (isLocker) {
      noteParts.push(
        `Paczkomat InPost: ${locker!.code}${
          locker!.description ? ` (${locker!.description})` : ""
        }`
      );
    }
    if (paidInEur) {
      noteParts.push(
        `Zapłacono ${payment.paidTotal.toFixed(2)} € (kurs ${EXCHANGE_RATE_PLN_PER_EUR}).`
      );
    }
    if (!isPaid) {
      noteParts.push(
        "UWAGA: Stripe jeszcze potwierdza tę płatność (metoda odroczona). " +
          "Zamówienie czeka wstrzymane — sprawdź płatność w Stripe przed wysyłką."
      );
    }
    // Płatność już przeszła, więc zamówienie musi powstać niezależnie od stanu
    // magazynu — inaczej pieniądze zostałyby wzięte bez śladu w panelu. Jeśli
    // ktoś zdążył kupić tę samą pracę, Magda widzi to wprost przy zamówieniu.
    if (conflicts.length) {
      noteParts.push(
        `UWAGA: w chwili składania zamówienia te prace były już niedostępne: ${conflicts
          .map((conflict) => conflict.name)
          .join(", ")}. Płatność została pobrana — do sprawdzenia przed wysyłką.`
      );
    }

    try {
      const order = await this.wcFetch<RawPlacedOrder>("orders", {
        method: "POST",
        body: JSON.stringify({
          payment_method: "stripe",
          payment_method_title: "Card / Apple Pay / Google Pay",
          set_paid: isPaid,
          ...(isPaid ? {} : { status: "on-hold" }),
          billing,
          shipping,
          line_items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          shipping_lines: [
            {
              method_id: "flat_rate",
              method_title: shippingTitle,
              total: shippingTotal.toFixed(2),
            },
          ],
          customer_note: noteParts.length ? noteParts.join("\n") : undefined,
          meta_data: metaData,
        }),
      });

      return { ok: true, order: { id: order.id, key: order.order_key } };
    } catch (error) {
      console.error("WooCommerce order error:", error);
      return { ok: false, error: CheckoutError.OrderFailed, unavailable: [] };
    }
  }
}

export const checkoutService = CheckoutService.getInstance();
