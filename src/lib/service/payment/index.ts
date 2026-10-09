import "server-only";

import { timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { PricedCart } from "@/contracts/server/checkout";
import { OrderProps } from "@/contracts/server/order";
import { PaymentRecord } from "@/contracts/server/payment";
import { PlacedOrder } from "@/contracts/server/order";
import {
  getPaymentMethodLabel,
  isReusableFor,
  PAYMENT_META,
  preparePayment,
} from "./helpers";

// Jedyne miejsce, które rozmawia ze Stripe'em. Trasy API dostają stąd gotowy
// PaymentRecord — nie surowy obiekt Stripe'a i tym bardziej nie to, co
// przysłała przeglądarka.
class PaymentService {
  private static instance: PaymentService;
  private readonly stripe: Stripe;

  private constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Kwota bierze się wyłącznie z wyceny policzonej na serwerze. Koszyk i kraj
  // idą do metadanych, bo tylko po nich zamówienie pozna później, za co
  // dokładnie klient zapłacił.
  async createIntent(cart: PricedCart, country: string): Promise<string | null> {
    const intent = await this.stripe.paymentIntents.create({
      amount: cart.total,
      currency: cart.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        [PAYMENT_META.cart]: cart.fingerprint,
        [PAYMENT_META.country]: country,
        [PAYMENT_META.shipping]: cart.shippingAmount.toString(),
      },
    });

    return intent.client_secret;
  }

  // Płatność za zamówienie, które już leży w WooCommerce — ze strony
  // zamówienia (link z maila, panel klienta). Jeśli poprzednia płatność tego
  // zamówienia wciąż czeka na klienta i opiewa na tę samą kwotę, wracamy do
  // niej: jedno zamówienie, jedna płatność, więc anulowanie ma co zamknąć,
  // a dwie otwarte karty nie pobiorą pieniędzy dwa razy. Inaczej poprzednią
  // zamykamy i zakładamy nową.
  //
  // Kwota bierze się z zamówienia (WooCommerce policzył je sam z numerów
  // produktów), w walucie, którą klient wybrał w kasie (patrz
  // getOrderAmounts) — nie z niczego, co przyszło z przeglądarki. W metadanych
  // zostaje numer i klucz zamówienia, więc domknięcie płatności wie, co
  // oznaczyć.
  async getOrderIntent(
    order: OrderProps,
    currentIntentId: string | null
  ): Promise<{ id: string; clientSecret: string } | null> {
    const amount = Math.round(order.total * 100);

    if (currentIntentId) {
      const current = await this.retrieveIfExists(currentIntentId);
      if (current && isReusableFor(current, amount, order.currency) && current.client_secret) {
        return { id: current.id, clientSecret: current.client_secret };
      }
      if (current) await this.release(current);
    }

    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: order.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        [PAYMENT_META.orderId]: order.id.toString(),
        [PAYMENT_META.orderKey]: order.key,
      },
    });

    return intent.client_secret
      ? { id: intent.id, clientSecret: intent.client_secret }
      : null;
  }

  // Zamyka płatność, żeby nie dało się już za nią zapłacić (anulowane
  // zamówienie, płatność zastąpiona nową). Płatności, która przeszła albo
  // jest w drodze, nie da się zamknąć — i dobrze: wtedy zwracamy jej stan,
  // a o zamówieniu decyduje to, że pieniądze idą. Null, gdy Stripe takiej
  // płatności nie zna.
  async releaseIntent(paymentIntentId: string): Promise<PaymentRecord | null> {
    const intent = await this.retrieveIfExists(paymentIntentId);
    return intent ? preparePayment(await this.release(intent)) : null;
  }

  // Null tylko wtedy, gdy Stripe mówi, że takiej płatności nie ma. Awaria
  // Stripe'a leci dalej — anulowanie zamówienia bez zamknięcia płatności
  // zostawiłoby otwartą drogę do zapłaty za anulowane.
  private async retrieveIfExists(id: string): Promise<Stripe.PaymentIntent | null> {
    try {
      return await this.stripe.paymentIntents.retrieve(id);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") {
        return null;
      }
      throw error;
    }
  }

  private async release(intent: Stripe.PaymentIntent): Promise<Stripe.PaymentIntent> {
    if (
      intent.status === "succeeded" ||
      intent.status === "processing" ||
      intent.status === "canceled"
    ) {
      return intent;
    }
    return this.stripe.paymentIntents.cancel(intent.id);
  }

  async getPayment(paymentIntentId: string): Promise<PaymentRecord | null> {
    try {
      return preparePayment(
        await this.stripe.paymentIntents.retrieve(paymentIntentId)
      );
    } catch (error) {
      console.error("Stripe payment lookup failed:", error);
      return null;
    }
  }

  // Czym klient zapłacił — dla panelu WooCommerce. Null przy każdym błędzie,
  // także gdy klucz nie ma uprawnienia do odczytu metod płatności: zapłata
  // zapisze się wtedy bez nazwy metody, ale się zapisze.
  async getMethodLabel(paymentIntentId: string): Promise<string | null> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["payment_method"],
      });
      const method = intent.payment_method;
      return method && typeof method !== "string" ? getPaymentMethodLabel(method) : null;
    } catch (error) {
      console.error("Stripe payment method lookup failed:", error);
      return null;
    }
  }

  // Płatność, ale tylko dla tego, kto zna jej „client secret" — czyli dla
  // przeglądarki, która płaciła (Stripe dopisuje go do adresu powrotu).
  // Sam numer płatności nie wystarcza, żeby dostać od nas klucz zamówienia.
  async getClientPayment(
    paymentIntentId: string,
    clientSecret: string
  ): Promise<PaymentRecord | null> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const expected = Buffer.from(intent.client_secret ?? "");
      const received = Buffer.from(clientSecret);
      if (
        expected.length === 0 ||
        expected.length !== received.length ||
        !timingSafeEqual(expected, received)
      ) {
        return null;
      }
      return preparePayment(intent);
    } catch (error) {
      console.error("Stripe payment lookup failed:", error);
      return null;
    }
  }

  // Przypięcie szkicu zamówienia do płatności, zanim klient zapłaci. Od tej
  // chwili płatność sama wie, które zamówienie domknąć — nie potrzeba do tego
  // przeglądarki klienta. Stripe dokłada podane klucze do istniejących
  // metadanych, więc zapis koszyka i kraju zostają na miejscu. Błąd leci dalej:
  // płatność bez przypiętego zamówienia to dokładnie ta dziura, którą to łata.
  async attachOrder(paymentIntentId: string, order: PlacedOrder): Promise<void> {
    await this.stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        [PAYMENT_META.orderId]: order.id.toString(),
        [PAYMENT_META.orderKey]: order.key,
      },
    });
  }

  isWebhookConfigured(): boolean {
    return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  }

  // Zdarzenie z webhooka Stripe'a → płatność, o którą chodzi. Podpis jest
  // sprawdzany na surowej treści żądania; podrobione albo przeterminowane
  // zdarzenie kończy się wyjątkiem. Liczą się dwa zdarzenia: pieniądze doszły
  // albo metoda odroczona zaczęła je potwierdzać. Resztę zwracamy jako null.
  // Stan płatności czytamy od Stripe'a na nowo, bo zdarzenia potrafią przyjść
  // w innej kolejności, niż się wydarzyły.
  async getWebhookPayment(
    body: string,
    signature: string
  ): Promise<PaymentRecord | null> {
    const event = this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (
      event.type !== "payment_intent.succeeded" &&
      event.type !== "payment_intent.processing"
    ) {
      return null;
    }

    return this.getPayment(event.data.object.id);
  }
}

export const paymentService = PaymentService.getInstance();
