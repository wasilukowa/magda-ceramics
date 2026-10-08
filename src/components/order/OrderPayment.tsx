"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { OrderProps } from "@/contracts/server/order";
import { getStripeFonts } from "@/lib/helpers/stripeAppearance";
import { useStripeAppearance } from "@/hooks/useStripeAppearance";
import { formatPrice } from "@/lib/helpers/currency";
import { ButtonArrow, buttonClass } from "@/components/ui/button";
import { ButtonSize } from "@/contracts/shared";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// `returnPath` — strona zamówienia (ścieżka z numerem i kluczem), na którą
// Stripe odeśle klienta po zapłacie.
function PaymentForm({ order, returnPath }: { order: OrderProps; returnPath: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("order");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${returnPath}` },
    });

    // Stripe wraca tutaj tylko wtedy, gdy płatność się NIE udała — przy
    // powodzeniu przeglądarka jest już na stronie zamówienia z wynikiem.
    if (stripeError) {
      setError(stripeError.message ?? t("error"));
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
        className={buttonClass({ size: ButtonSize.Block })}
      >
        {loading ? (
          t("processing")
        ) : (
          <>
            {t("payButton", { total: formatPrice(order.total, order.currency) })}
            <ButtonArrow />
          </>
        )}
      </button>
    </form>
  );
}

// Formularz zapłaty za złożone zamówienie. Ten sam wygląd co w kasie — klient
// nie powinien poznać, że to inna strona sklepu.
export default function OrderPayment({
  order,
  clientSecret,
  returnPath,
}: {
  order: OrderProps;
  clientSecret: string | null;
  returnPath: string;
}) {
  const t = useTranslations("order");
  const stripeAppearance = useStripeAppearance();

  if (!clientSecret) {
    return (
      <p className="border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--color-error)]">
        {t("unavailable")}
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        fonts: getStripeFonts(),
        appearance: stripeAppearance,
      }}
    >
      <PaymentForm order={order} returnPath={returnPath} />
    </Elements>
  );
}
