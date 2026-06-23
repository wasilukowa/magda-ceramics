import Stripe from "stripe";
import { CartItem } from "@/contracts/server/cart";
import { Currency } from "@/contracts/shared";
import { getShippingAmount } from "@/lib/helpers/shipping";
import { getUnitPrice } from "@/lib/helpers/currency";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { items, country, currency } = (await request.json()) as {
    items: CartItem[];
    country: string;
    currency: Currency;
  };

  if (!items || items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  // All amounts in the chosen currency's smallest unit (grosze / euro cents).
  const productsAmount = items.reduce(
    (sum, item) =>
      sum + Math.round(getUnitPrice(item, currency) * item.quantity * 100),
    0
  );

  const amount = productsAmount + getShippingAmount(country, currency);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
  });

  return Response.json({ clientSecret: paymentIntent.client_secret });
}
