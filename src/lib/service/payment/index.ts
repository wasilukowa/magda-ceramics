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

  // Przypisanie zamówienia do płatności. To ono sprawia, że jedna płatność daje
  // jedno zamówienie — odświeżenie strony potwierdzenia nie zrobi drugiego.
  // Stripe dokłada podane klucze do istniejących metadanych, więc zapis koszyka
  // i kraju zostają na miejscu.
  async claimOrder(paymentIntentId: string, order: PlacedOrder): Promise<void> {
    try {
      await this.stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          [PAYMENT_META.orderId]: order.id.toString(),
          [PAYMENT_META.orderKey]: order.key,
        },
      });
    } catch (error) {
      // Zamówienie już jest — brak przypięcia grozi najwyżej duplikatem przy
      // ponownej próbie, więc nie ma po co przerywać klientowi zakupu.
      console.error("Stripe order claim failed:", error);
    }
  }
}

export const paymentService = PaymentService.getInstance();
