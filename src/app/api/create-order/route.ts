import { serverFetch } from "@/lib/api";
import { BillingAddress, OrderItem } from "@/contracts/server/cart";
import { Currency } from "@/contracts/shared";
import { getShippingCostInZloty } from "@/lib/helpers/shipping";
import { EXCHANGE_RATE_PLN_PER_EUR } from "@/lib/helpers/currency";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

export async function POST(request: Request) {
  const { billing, items, paymentIntentId, currency, paidTotal } =
    (await request.json()) as {
      billing: BillingAddress;
      items: OrderItem[];
      paymentIntentId: string;
      currency: Currency;
      paidTotal: number;
    };

  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

  // Shipping is derived from the billing country here too (not trusted from the
  // client) so the order total always matches what Stripe charged.
  const shippingTotal = getShippingCostInZloty(billing.country);

  // Orders are always recorded in the PLN store currency. When the customer
  // paid in EUR, record the actual charged amount + rate so the studio can
  // reconcile it against Stripe.
  const paidInEur = currency === Currency.EUR;
  const metaData = [
    { key: "_stripe_payment_intent", value: paymentIntentId },
    ...(paidInEur
      ? [
          { key: "_paid_currency", value: "EUR" },
          { key: "_paid_amount", value: paidTotal.toFixed(2) },
          { key: "_exchange_rate", value: EXCHANGE_RATE_PLN_PER_EUR.toString() },
        ]
      : []),
  ];
  const customerNote = paidInEur
    ? `Zapłacono ${paidTotal.toFixed(2)} € (kurs ${EXCHANGE_RATE_PLN_PER_EUR}).`
    : undefined;

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
      shipping_lines: [
        {
          method_id: "flat_rate",
          method_title: "Shipping",
          total: shippingTotal.toFixed(2),
        },
      ],
      customer_note: customerNote,
      meta_data: metaData,
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
