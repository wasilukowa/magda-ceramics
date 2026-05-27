import Stripe from "stripe";
import { CartItem } from "@/contracts/server/cart";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { items } = (await request.json()) as { items: CartItem[] };

  if (!items || items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  const amount = items.reduce(
    (sum, item) => sum + Math.round(parseFloat(item.price) * item.quantity * 100),
    0
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "pln",
    automatic_payment_methods: { enabled: true },
  });

  return Response.json({ clientSecret: paymentIntent.client_secret });
}
