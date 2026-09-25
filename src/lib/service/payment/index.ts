import "server-only";

import Stripe from "stripe";
import { PricedCart } from "@/contracts/server/checkout";
import { OrderProps } from "@/contracts/server/order";
import { PaymentRecord } from "@/contracts/server/payment";
import { PlacedOrder } from "@/contracts/server/order";
import { PAYMENT_META, preparePayment } from "./helpers";

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

  // Druga próba zapłaty — za zamówienie, które już leży w WooCommerce.
  // Kwota bierze się z zamówienia (WooCommerce policzył je sam z numerów
  // produktów), a nie z niczego, co przyszło z przeglądarki. W metadanych
  // zostaje numer zamówienia, więc domknięcie płatności wie, co oznaczyć.
  async createOrderIntent(order: OrderProps): Promise<string | null> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.total) * 100),
      currency: order.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { [PAYMENT_META.orderId]: order.id.toString() },
    });

    return intent.client_secret;
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
