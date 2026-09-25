import "server-only";

import { serverFetch } from "@/lib/api";
import { CartItemState, OrderItem } from "@/contracts/server/cart";
import { ProductProps, RawProduct } from "@/contracts/server/product";
import {
  CompletedOrder,
  OrderCompletion,
  OrderStatus,
  RawPlacedOrder,
} from "@/contracts/server/order";
import {
  AvailabilityResult,
  CartPricingResult,
  CheckoutError,
  CheckoutFailure,
  DraftOrderInput,
  DraftOrderResult,
  PricedLine,
  UnavailableItem,
} from "@/contracts/server/checkout";
import { PaymentRecord, PaymentStatus } from "@/contracts/server/payment";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { prepareProduct } from "@/lib/service/product/helpers";
import { orderService } from "@/lib/service/order";
import { getUnitPrice } from "@/lib/helpers/currency";
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

  // Szkic zamówienia zapisany tuż PRZED płatnością. Dzięki niemu płatność od
  // początku wie, które zamówienie opłaca, i domknie je sama — webhookiem
  // Stripe'a — nawet gdy klient po zapłacie nie wróci do tej karty
  // przeglądarki (BLIK i przelewy na telefonie otwierają aplikację banku
  // i wracają gdzie indziej). Wcześniej dane zamówienia żyły wyłącznie
  // w przeglądarce, więc taka płatność kończyła się pieniędzmi bez zamówienia.
  //
  // Szkic (`checkout-draft`) nie pokazuje się na liście zamówień ani w panelu
  // klienta i nie łapie się na przypomnienie o zapłacie — porzucony przy
  // odrzuconej karcie nikomu nie przeszkadza. Za drugim kliknięciem „Zapłać"
  // powstaje nowy szkic zamiast poprawiania starego: poprawka przez API
  // dopisałaby drugą linię wysyłki zamiast podmienić pierwszą.
  async saveDraftOrder({
    billing,
    items,
    note,
    customerId,
    deliveryMethod,
    locker,
  }: DraftOrderInput): Promise<DraftOrderResult> {
    // Wysyłkę liczymy z kraju adresu, nie z tego, co przyszło w żądaniu — a że
    // ten sam kraj musiał być użyty przy płatności (metadane w Stripe), suma
    // zamówienia zgadza się z tym, co klient zapłaci.
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

    // Tu trafia tylko to, co klient może przeczytać w swoim mailu: jego własna
    // uwaga i wybrany paczkomat. Uwagi dla Magdy idą osobno, jako notatki
    // prywatne — patrz OrderService.
    const noteParts: string[] = [];
    if (note) noteParts.push(note);
    if (isLocker) {
      noteParts.push(
        `Paczkomat InPost: ${locker!.code}${
          locker!.description ? ` (${locker!.description})` : ""
        }`
      );
    }

    try {
      const order = await this.wcFetch<RawPlacedOrder>("orders", {
        method: "POST",
        body: JSON.stringify({
          status: OrderStatus.CheckoutDraft,
          ...(customerId ? { customer_id: customerId } : {}),
          payment_method: "stripe",
          payment_method_title: "Card / Apple Pay / Google Pay",
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
          meta_data: isLocker
            ? [{ key: "_inpost_locker_id", value: locker!.code }]
            : [],
        }),
      });

      return { ok: true, order: { id: order.id, key: order.order_key } };
    } catch (error) {
      console.error("WooCommerce draft order error:", error);
      return { ok: false, error: CheckoutError.OrderFailed, unavailable: [] };
    }
  }

  // Domknięcie płatności — jedno dla strony potwierdzenia i dla webhooka
  // Stripe'a. Obie drogi potrafią przyjść naraz albo po kilka razy, więc
  // wszystko tu jest powtarzalne: zamówienie już opłacone zostaje, jakie jest.
  // Null znaczy, że płatność nie należy do żadnego zamówienia albo jeszcze nie
  // przeszła.
  //
  // Numer zamówienia w metadanych płatności zapisuje wyłącznie nasz serwer:
  // kasa przy szkicu (razem z kluczem zamówienia) albo panel klienta przy
  // „Zapłać" (bez klucza, ale dopiero po sprawdzeniu właściciela w sesji).
  // Dlatego domknięcie może mu ufać także bez sesji — np. w webhooku.
  async completePayment(payment: PaymentRecord): Promise<CompletedOrder | null> {
    if (!payment.orderId) return null;
    if (
      payment.status !== PaymentStatus.Succeeded &&
      payment.status !== PaymentStatus.Processing
    ) {
      return null;
    }

    const order = await orderService.getOrderForPayment(payment.orderId);
    // Płatność z kasy niesie klucz swojego szkicu — musi się zgadzać.
    if (!order || (payment.orderKey && order.key !== payment.orderKey)) {
      console.error(
        `Payment ${payment.id}: order ${payment.orderId} missing or not matching`
      );
      return null;
    }

    const awaiting =
      order.status === OrderStatus.CheckoutDraft ||
      order.status === OrderStatus.Pending ||
      order.status === OrderStatus.Failed;
    const onHold = order.status === OrderStatus.OnHold;

    if (payment.status === PaymentStatus.Processing) {
      if (awaiting) {
        await orderService.markAwaitingConfirmation(order.id, order.status, payment);
      }
      return { id: order.id, completion: OrderCompletion.AwaitingConfirmation };
    }

    // Zapłacone. Zamówienie już w realizacji (albo dalej) nie potrzebuje
    // niczego — to druga z dwóch dróg, które przyszły po to samo.
    if (awaiting || onHold) {
      // Ceramika to pojedyncze sztuki. Jeśli ktoś zapłacił za tę samą pracę
      // wcześniej, zamówienie i tak musi zostać opłacone — pieniądze już są —
      // ale Magda musi to zobaczyć, zanim spakuje paczkę.
      const conflicts = await this.getSoldOutConflicts(order.items);
      const remarks = conflicts.length
        ? [
            `UWAGA: w chwili zapłaty te prace były już niedostępne: ${conflicts
              .map((conflict) => conflict.name)
              .join(", ")}. Płatność została pobrana — do sprawdzenia przed wysyłką.`,
          ]
        : [];
      await orderService.markPaid(order.id, order.status, payment, remarks);
    }

    return { id: order.id, completion: OrderCompletion.Paid };
  }
}

export const checkoutService = CheckoutService.getInstance();
