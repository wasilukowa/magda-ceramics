import { serverFetch } from "@/lib/api";
import { BillingAddress, OrderItem } from "@/contracts/server/cart";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

export async function POST(request: Request) {
  const { billing, items, paymentIntentId } = (await request.json()) as {
    billing: BillingAddress;
    items: OrderItem[];
    paymentIntentId: string;
  };

  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

  const res = await serverFetch(`${WP_URL}/wp-json/wc/v3/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payment_method: "stripe",
      payment_method_title: "Card / Apple Pay / Google Pay",
      set_paid: true,
      billing,
      shipping: billing,
      line_items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      meta_data: [{ key: "_stripe_payment_intent", value: paymentIntentId }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("WooCommerce order error:", err);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }

  const order = await res.json();
  return Response.json({ orderId: order.id, orderKey: order.order_key });
}
