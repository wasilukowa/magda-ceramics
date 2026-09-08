"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { OrderProps } from "@/contracts/server/order";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Wygląd pól Stripe'a taki sam jak w kasie — klient nie powinien poznać, że to
// inna strona sklepu.
const APPEARANCE = {
  theme: "flat" as const,
  variables: {
    fontFamily: "var(--font-montserrat), sans-serif",
    colorBackground: "var(--background)",
    colorText: "var(--foreground)",
    colorTextPlaceholder: "#9ca3af",
    borderRadius: "0px",
    fontSizeBase: "13px",
  },
  rules: {
    ".Input": { border: "1px solid var(--border)", padding: "12px" },
    ".Input:focus": {
      border: "1px solid var(--foreground)",
      boxShadow: "none",
      outline: "none",
    },
    ".Label": {
      fontSize: "10px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "6px",
    },
  },
};

function PaymentForm({ order }: { order: OrderProps }) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("account");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const localePrefix = locale === "en" ? "" : `/${locale}`;
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${localePrefix}${
          locale === "pl" ? "/konto/zamowienia/oplacone" : "/account/orders/paid"
        }?order=${order.id}`,
      },
    });

    // Stripe wraca tutaj tylko wtedy, gdy płatność się NIE udała — przy
    // powodzeniu przeglądarka jest już na stronie potwierdzenia.
    if (stripeError) {
      setError(stripeError.message ?? t("pay.error"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement />
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {loading
          ? t("pay.processing")
          : t("pay.button", { total: order.total, currency: order.currency })}
      </button>
    </form>
  );
}

export default function OrderPayment({
  order,
  clientSecret,
}: {
  order: OrderProps;
  clientSecret: string | null;
}) {
  const t = useTranslations("account");

  if (!clientSecret) {
    return (
      <p className="border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--color-error)]">
        {t("pay.unavailable")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="border border-[var(--border)] px-5 py-4 flex flex-col gap-3">
        <p className="text-sm font-medium">
          {t("orders.number", { number: order.number })}
        </p>
        <ul className="text-sm text-[var(--muted)] flex flex-col gap-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {item.name}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
              <span className="whitespace-nowrap">
                {item.total} {order.currency}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-[var(--border)] pt-3 text-sm">
          <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
            {t("orders.total")}
          </span>
          <span className="font-medium">
            {order.total} {order.currency}
          </span>
        </div>
      </div>

      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: APPEARANCE }}
      >
        <PaymentForm order={order} />
      </Elements>
    </div>
  );
}
