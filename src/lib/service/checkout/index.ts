import "server-only";

import { serverFetch } from "@/lib/api";
import { CartItemState, OrderItem } from "@/contracts/server/cart";
import { ProductProps, RawProduct } from "@/contracts/server/product";
import {
  CancelReason,
  CancelResult,
  CompletedOrder,
  OrderCompletion,
  OrderPaymentState,
  OrderProps,
  OrderStatus,
  PlacedOrder,
  RawPlacedOrder,
  RawReservingOrder,
} from "@/contracts/server/order";
import {
  AvailabilityResult,
  CartPricingResult,
  CheckoutError,
  CheckoutFailure,
  PlaceOrderInput,
  PlaceOrderResult,
  PricedLine,
  UnavailableItem,
  UnavailableReason,
} from "@/contracts/server/checkout";
import { PaymentRecord, PaymentStatus } from "@/contracts/server/payment";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import {
  getReservedProductIds,
  prepareProduct,
  PUBLISHED_ONLY,
  withReservations,
} from "@/lib/service/product/helpers";
import { orderService } from "@/lib/service/order";
import { paymentService } from "@/lib/service/payment";
import { UNKNOWN_PAYMENT_METHOD_LABEL } from "@/lib/service/payment/helpers";
import { customerMailService } from "@/lib/service/customerMail";
import { studioMailService } from "@/lib/service/studioMail";
import {
  LOCKER_META_KEY,
  LOCKER_NOTE_PREFIX,
  ORDER_META,
} from "@/lib/service/order/helpers";
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
  private async getLiveRawProducts(ids: number[]): Promise<RawProduct[]> {
    return this.wcFetch<RawProduct[]>(
      `products?${PUBLISHED_ONLY}&include=${ids.join(",")}&per_page=${ids.length}`
    );
  }

  // Do tego, które z niedostępnych prac są tylko zarezerwowane (czekają na
  // czyjąś wpłatę). Bez tej wiedzy klient zobaczyłby „sprzedane" przy pracy,
  // która za dwa dni może wrócić — więc awaria tej listy niczego nie blokuje,
  // najwyżej napis będzie mniej dokładny.
  private async getLiveProducts(ids: number[]): Promise<ProductProps[]> {
    const [raw, reserving] = await Promise.all([
      this.getLiveRawProducts(ids),
      this.wcFetch<RawReservingOrder[]>(
        "orders?status=on-hold&per_page=100&_fields=line_items"
      ).catch(() => []),
    ]);
    return withReservations(raw.map(prepareProduct), getReservedProductIds(reserving));
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
        return [{ id, name: "", price: "", purchasable: false, reserved: false }];
      }

      return [
        {
          id,
          name: product.name,
          price: product.price,
          purchasable: product.hasPrice && product.inStock,
          reserved: product.reserved,
        },
      ];
    });
  }

  // Ile naprawdę kosztuje ten koszyk. Ceny biorą się z WooCommerce po numerze
  // produktu, wysyłka z cennika dla kraju i sposobu dostawy — żadnej kwoty nie
  // bierzemy z żądania.
  async priceCart(
    items: OrderItem[],
    country: string,
    currency: Currency,
    deliveryMethod: DeliveryMethod
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
    const shippingAmount = getShippingAmount(country, currency, deliveryMethod);

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

  // Prace, które zdążyły się sprzedać (albo trafić do czyjegoś złożonego
  // zamówienia), zanim to zamówienie zostało opłacone. Dotyczy tylko zamówień,
  // które pracy nie trzymały — patrz completePayment. Niedostępny WooCommerce
  // nie liczy się jako konflikt — to nie jest moment na zgadywanie, a i tak
  // jest już po płatności.
  private async getSoldOutConflicts(
    items: OrderItem[]
  ): Promise<UnavailableItem[]> {
    const availability = await this.getAvailability(items);
    return availability.ok ? [] : availability.unavailable;
  }

  // Złożenie zamówienia — PRZED zapłatą (decyzja Natalii 2026-10-08):
  // zamówienie jest złożone, klient dostaje maila, praca znika ze sklepu
  // zarezerwowana na 48 h, a dopiero potem klient płaci. Płatność, która nie
  // przejdzie, nie kasuje zamówienia — klient zapłaci później z linku
  // w mailu, a bez wpłaty sklep sam anuluje zamówienie po terminie.
  //
  // Kolejność: szkic w WooCommerce → przypięcie szkicu do płatności w Stripe
  // (od tej chwili płatność sama wie, co opłaca, i domknie to webhookiem, choćby
  // klient nie wrócił do tej karty przeglądarki) → złożenie (on-hold, sztuka
  // zdjęta z magazynu) → mail „złożone". Gdy coś padnie przed złożeniem,
  // szkic zostaje niewidoczny i nikomu nie przeszkadza.
  //
  // Ta sama płatność drugi raz (podwójne kliknięcie, ponowione żądanie) nie
  // zakłada drugiego zamówienia: płatność ma już przypięte swoje.
  async placeOrder(
    input: PlaceOrderInput,
    payment: PaymentRecord
  ): Promise<PlaceOrderResult> {
    if (payment.orderId) {
      const existing = await orderService
        .getOrderForPayment(payment.orderId)
        .catch(() => null);
      if (!existing || existing.key !== payment.orderKey) {
        return { ok: false, error: CheckoutError.PaymentNotVerified, unavailable: [] };
      }
      const placed = { id: existing.id, key: existing.key };
      if (existing.status === OrderStatus.OnHold) return { ok: true, order: placed };
      if (existing.status !== OrderStatus.CheckoutDraft) {
        return { ok: false, error: CheckoutError.PaymentNotVerified, unavailable: [] };
      }
      return this.finishPlacement(placed, existing.items, payment.id);
    }

    // Złożenie rezerwuje pracę, więc dostępność sprawdzamy tutaj, na serwerze,
    // a nie tylko w przeglądarce.
    const purchasable = await this.getPurchasableProducts(input.items);
    if (!purchasable.ok) return purchasable;

    const draft = await this.saveDraftOrder(input);
    if (!draft.ok) return draft;

    try {
      await paymentService.attachOrder(payment.id, draft.order);
    } catch (error) {
      // Bez przypięcia płatność nie wiedziałaby, co opłaca. Klient nie
      // zapłaci, dopóki się nie uda — szkic zostaje niewidoczny.
      console.error("Stripe order attach failed:", error);
      return { ok: false, error: CheckoutError.OrderFailed, unavailable: [] };
    }

    return this.finishPlacement(draft.order, input.items, payment.id);
  }

  private async finishPlacement(
    order: PlacedOrder,
    items: OrderItem[],
    paymentIntentId: string
  ): Promise<PlaceOrderResult> {
    try {
      await orderService.markPlaced(order.id, paymentIntentId);
    } catch (error) {
      console.error(`Order ${order.id}: placement failed:`, error);
      return { ok: false, error: CheckoutError.OrderFailed, unavailable: [] };
    }

    // Dwie osoby, ta sama praca, ta sama sekunda: obie przeszły sprawdzenie
    // dostępności, obie zdjęły sztukę, magazyn spadł poniżej zera. Zostaje
    // zamówienie złożone pierwsze (niższy numer), drugie ustępuje — anuluje
    // się (sztuka wraca) i klient dostaje „ktoś był szybszy". Sprawdzone
    // 2026-10-08 dwoma równoczesnymi zamówieniami: bez tej reguły ustępowały
    // obie i nikt pracy nie dostał.
    const overbooked = await this.getOverbookedItems(items, order.id).catch(() => []);
    if (overbooked.length) {
      await orderService
        .cancel(
          order.id,
          "Anulowane od razu przy składaniu: ktoś w tej samej chwili zamówił tę " +
            "samą pracę. Klient zobaczył w kasie, że praca jest niedostępna, " +
            "i nic nie zapłacił."
        )
        .catch((error) => console.error(`Order ${order.id}: cancel failed:`, error));
      await paymentService.releaseIntent(paymentIntentId).catch(() => null);
      return { ok: false, error: CheckoutError.Unavailable, unavailable: overbooked };
    }

    // Przed zwróceniem odpowiedzi, czyli zanim klient zacznie płacić — dzięki
    // temu „złożone" zawsze przychodzi przed „opłacone".
    await customerMailService.sendPlaced(order.id);
    return { ok: true, order };
  }

  // Prace, których magazyn po złożeniu spadł poniżej zera, a które trzyma
  // wcześniejsze złożone zamówienie — patrz finishPlacement.
  private async getOverbookedItems(
    items: OrderItem[],
    orderId: number
  ): Promise<UnavailableItem[]> {
    const raw = await this.getLiveRawProducts(items.map((item) => item.id));
    const oversold = raw.filter(
      (product) => typeof product.stock_quantity === "number" && product.stock_quantity < 0
    );

    const lost: UnavailableItem[] = [];
    for (const product of oversold) {
      const holders = await this.wcFetch<{ id: number }[]>(
        `orders?status=${OrderStatus.OnHold}&product=${product.id}&per_page=100&_fields=id`
      );
      const first = Math.min(...holders.map((holder) => holder.id));
      if (first !== orderId) {
        lost.push({ id: product.id, name: product.name, reason: UnavailableReason.Reserved });
      }
    }
    return lost;
  }

  // Szkic zamówienia (`checkout-draft`) — niewidoczny na liście zamówień i w
  // panelu klienta, dopóki placeOrder go nie złoży. Każde nowe złożenie
  // zaczyna od nowego szkicu zamiast poprawiać stary: poprawka przez API
  // dopisałaby drugą linię wysyłki zamiast podmienić pierwszą.
  private async saveDraftOrder({
    billing,
    items,
    note,
    customerId,
    deliveryMethod,
    locker,
    locale,
    currency,
  }: PlaceOrderInput): Promise<PlaceOrderResult> {
    // Wysyłkę liczymy z cennika dla kraju adresu i sposobu dostawy, nie z kwoty
    // z żądania — a że ta sama kwota musiała być w płatności (metadane
    // w Stripe, patrz canDraftOrderFor), suma zamówienia zgadza się z tym, co
    // klient zapłaci. Sposób dostawy przychodzi tu już rozstrzygnięty
    // (resolveDeliveryMethod).
    const shippingTotal = getShippingCostInZloty(billing.country, deliveryMethod);

    // Parcel-locker orders (Poland + InPost International countries): ship to
    // the locker's address and label the shipping line with the locker code so
    // the studio knows where to send it.
    const isLocker = deliveryMethod === DeliveryMethod.Locker && !!locker;
    const shipping = isLocker
      ? {
          ...billing,
          company: `Paczkomat ${locker!.code}`,
          address_1: locker!.description || locker!.code,
          address_2: "",
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
        `${LOCKER_NOTE_PREFIX}${locker!.code}${
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
          payment_method_title: UNKNOWN_PAYMENT_METHOD_LABEL,
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
          meta_data: [
            ...(isLocker ? [{ key: LOCKER_META_KEY, value: locker!.code }] : []),
            // W tym języku i tej walucie klient dostanie maile i zobaczy
            // zamówienie na koncie — patrz getOrderPreferences.
            ...(locale ? [{ key: ORDER_META.locale, value: locale }] : []),
            { key: ORDER_META.currency, value: currency },
          ],
        }),
      });

      return { ok: true, order: { id: order.id, key: order.order_key } };
    } catch (error) {
      console.error("WooCommerce draft order error:", error);
      return { ok: false, error: CheckoutError.OrderFailed, unavailable: [] };
    }
  }

  // Co klient może już zobaczyć o swojej płatności — bez zapisywania
  // czegokolwiek. Numer zamówienia bierzemy z płatności (przypiął go tam
  // szkic), a stan ze Stripe'a. Strona potwierdzenia pokazuje to od razu,
  // a samo domknięcie zostawia webhookowi — patrz niżej, dlaczego.
  //
  // Płatność, która nie przeszła, też ma już swoje zamówienie (złożone przed
  // zapłatą) — wtedy „nieopłacone", o ile płatność pochodzi od nas (ma klucz
  // zamówienia).
  describePayment(payment: PaymentRecord): CompletedOrder | null {
    if (!payment.orderId) return null;
    if (payment.status === PaymentStatus.Succeeded) {
      return { id: payment.orderId, completion: OrderCompletion.Paid };
    }
    if (payment.status === PaymentStatus.Processing) {
      return {
        id: payment.orderId,
        completion: OrderCompletion.AwaitingConfirmation,
      };
    }
    if (payment.orderKey) {
      return { id: payment.orderId, completion: OrderCompletion.Unpaid };
    }
    return null;
  }

  // Domknięcie płatności: zapis w WooCommerce, że zapłacono. Powtarzalne —
  // zamówienie już opłacone zostaje, jakie jest. Null znaczy, że płatność nie
  // należy do żadnego zamówienia albo jeszcze nie przeszła.
  //
  // ‼️ Woła to JEDNA droga naraz. Sprawdzone 2026-09-25 na zamówieniu #282:
  // webhook i strona potwierdzenia przyszły w tej samej sekundzie, oba
  // zobaczyły szkic i oba go opłaciły — dwa razy maile, dwa razy zdjęta sztuka
  // z magazynu. WooCommerce nie ma zapisu „tylko jeśli stan się nie zmienił",
  // więc zamiast zamka jest jeden pisarz: webhook. Strona potwierdzenia pisze
  // wyłącznie tam, gdzie webhooka nie ma (lokalnie).
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

    // Złożone zamówienie (on-hold) trzyma swoją pracę od chwili złożenia —
    // nikt inny nie mógł jej w tym czasie kupić. Szkic i „oczekuje na
    // płatność" (sprzed 2026-10-08) oraz anulowane pracy nie trzymają, więc
    // u nich trzeba sprawdzić, czy ktoś nie był szybszy.
    const holdsStock = order.status === OrderStatus.OnHold;
    const cancelled = order.status === OrderStatus.Cancelled;
    const unpaid =
      holdsStock ||
      cancelled ||
      order.status === OrderStatus.CheckoutDraft ||
      order.status === OrderStatus.Pending ||
      order.status === OrderStatus.Failed;

    // Czym zapłacono — tylko gdy jest co zapisać. Bez tej nazwy zamówienie
    // i tak się domknie (patrz paymentService.getMethodLabel).
    const methodLabel = unpaid ? await paymentService.getMethodLabel(payment.id) : null;

    if (payment.status === PaymentStatus.Processing) {
      if (cancelled) {
        await orderService.addPrivateNote(
          order.id,
          "Stripe potwierdza płatność za ANULOWANE zamówienie (metoda odroczona). " +
            "Gdy pieniądze dojdą, zamówienie samo wróci jako opłacone — do sprawdzenia."
        );
      } else if (unpaid && !order.awaitingConfirmation) {
        await orderService.markAwaitingConfirmation(
          order.id,
          order.status,
          payment,
          methodLabel
        );
        await customerMailService.sendOnHold(order.id);
        if (!order.studioNotified) {
          await studioMailService.sendNewOrder(order.id, { awaitingConfirmation: true });
        }
      }
      return { id: order.id, completion: OrderCompletion.AwaitingConfirmation };
    }

    // Zapłacone. Zamówienie już w realizacji (albo dalej) nie potrzebuje
    // niczego — to druga z dwóch dróg, które przyszły po to samo.
    let conflictNames: string[] = [];
    if (unpaid) {
      // Ceramika to pojedyncze sztuki. Jeśli ktoś zapłacił za tę samą pracę
      // wcześniej, zamówienie i tak musi zostać opłacone — pieniądze już są —
      // ale Magda musi to zobaczyć, zanim spakuje paczkę.
      const conflicts = holdsStock ? [] : await this.getSoldOutConflicts(order.items);
      conflictNames = conflicts.map((conflict) => conflict.name);
      const remarks = [
        ...(cancelled
          ? [
              "Pieniądze przyszły za zamówienie, które było już anulowane — " +
                "zamówienie wróciło jako opłacone.",
            ]
          : []),
        ...(conflicts.length
          ? [
              `UWAGA: w chwili zapłaty te prace były już niedostępne: ${conflicts
                .map((conflict) => conflict.name)
                .join(", ")}. Płatność została pobrana — do sprawdzenia przed wysyłką.`,
            ]
          : []),
      ];
      await orderService.markPaid(order.id, order.status, payment, remarks, methodLabel);
    }

    // Potwierdzenie dla klienta — także wtedy, gdy zamówienie było już
    // opłacone, a mail jeszcze nie wyszedł (np. poprzednia próba przerwała się
    // po zapisaniu zapłaty). Wysyła się raz: patrz OrderForPayment.
    if (!order.confirmationSent) {
      await customerMailService.sendConfirmation(order.id);
    }
    // Mail do pracowni — raz na zamówienie. Przy metodzie odroczonej poszedł
    // już przy wstrzymaniu (z ostrzeżeniem „nie wysyłaj").
    if (!order.studioNotified) {
      await studioMailService.sendNewOrder(order.id, { conflicts: conflictNames });
    }

    return { id: order.id, completion: OrderCompletion.Paid };
  }

  // Płatność za złożone zamówienie ze strony zamówienia: „client secret"
  // płatności dla formularza Stripe'a. Wraca do płatności, którą zamówienie
  // już ma, albo zakłada nową i zapisuje ją przy zamówieniu — patrz
  // PaymentService.getOrderIntent. Null, gdy płatności nie da się uruchomić.
  async getOrderPayment(order: OrderProps): Promise<string | null> {
    if (!order.payable) return null;
    try {
      const current = await orderService.getOrderForPayment(order.id);
      const currentId = current?.paymentIntentId ?? null;
      const intent = await paymentService.getOrderIntent(order, currentId);
      if (!intent) return null;

      if (intent.id !== currentId) {
        try {
          await orderService.setPaymentIntent(order.id, intent.id);
        } catch (error) {
          // Płatność, o której zamówienie nie wie, nie dałaby się zamknąć przy
          // anulowaniu — lepiej jej nie pokazywać.
          await paymentService.releaseIntent(intent.id).catch(() => null);
          throw error;
        }
      }
      return intent.clientSecret;
    } catch (error) {
      console.error(`Order ${order.id}: payment could not be started:`, error);
      return null;
    }
  }

  // Stan zamówienia tuż po powrocie ze Stripe'a. Webhook potrafi dojść kilka
  // sekund po kliencie, więc to, co mówi Stripe, wygrywa z tym, co
  // WooCommerce zdążył zapisać. Zapisuje wyłącznie tam, gdzie webhooka nie ma
  // (lokalnie) — patrz completePayment, „jeden pisarz".
  async getStateAfterReturn(
    order: OrderProps,
    paymentIntentId: string
  ): Promise<OrderPaymentState> {
    if (order.paymentState !== OrderPaymentState.Unpaid) return order.paymentState;

    const payment = await paymentService.getPayment(paymentIntentId);
    if (!payment || payment.orderId !== order.id) return order.paymentState;

    if (!paymentService.isWebhookConfigured()) {
      await this.completePayment(payment).catch((error) =>
        console.error(`Order ${order.id}: completion failed:`, error)
      );
    }
    if (payment.status === PaymentStatus.Succeeded) return OrderPaymentState.Paid;
    if (payment.status === PaymentStatus.Processing) {
      return OrderPaymentState.AwaitingConfirmation;
    }
    return OrderPaymentState.Unpaid;
  }

  // Anulowanie złożonego, nieopłaconego zamówienia — przez klienta albo po
  // terminie. Najpierw zamykamy płatność w Stripe: zamknięta nie przyjmie już
  // pieniędzy, więc nikt nie zapłaci za anulowane. Jeśli zamknąć się jej nie
  // da, bo pieniądze właśnie przeszły albo są w drodze, zamówienie zostaje —
  // a gdy przeszły, zapisujemy zapłatę od razu, nie czekając na webhook.
  // Sztukę do magazynu oddaje WooCommerce sam (patrz OrderService.cancel).
  async cancelUnpaidOrder(orderId: number, reason: CancelReason): Promise<CancelResult> {
    const order = await orderService.getOrderForPayment(orderId);
    if (!order || order.status !== OrderStatus.OnHold || !order.reservedUntil) {
      return CancelResult.NotCancellable;
    }

    if (order.paymentIntentId) {
      const payment = await paymentService.releaseIntent(order.paymentIntentId);
      if (payment?.status === PaymentStatus.Succeeded) {
        await this.completePayment(payment);
        return CancelResult.Paid;
      }
      if (payment?.status === PaymentStatus.Processing) {
        await this.completePayment(payment);
        return CancelResult.NotCancellable;
      }
    }

    await orderService.cancel(
      orderId,
      reason === CancelReason.Customer
        ? "Anulowane przez klienta przed zapłatą. Praca wróciła do sklepu."
        : "Anulowane automatycznie: brak wpłaty w ciągu 48 h. Praca wróciła do sklepu."
    );
    await customerMailService.sendCancelled(orderId, reason);
    return CancelResult.Cancelled;
  }
}

export const checkoutService = CheckoutService.getInstance();
