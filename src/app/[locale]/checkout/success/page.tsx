"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/hooks/useCart";
import { CheckoutErrorResponse } from "@/contracts/server/checkout";
import { getOrderErrorKey } from "@/lib/helpers/checkout";

type OrderState =
  | { status: "loading" }
  | { status: "success"; orderId: number }
  | { status: "error"; message: string };

// Stripe odsyła tu klienta z wynikiem w adresie. „processing" to metoda
// odroczona (np. przelew albo Klarna): pieniądze jeszcze idą, ale zamówienie
// już jest i poczeka na nie — to nie porażka.
const ACCEPTED_REDIRECT_STATUSES = ["succeeded", "processing"];

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const t = useTranslations("success");
  const [state, setState] = useState<OrderState>({ status: "loading" });

  // Wynik płatności widać wprost w adresie, więc nie ma po co trzymać go w
  // stanie — wyliczamy przy renderze i nie pytamy o nic, gdy płatność nie
  // doszła do skutku.
  const paymentIntent = searchParams.get("payment_intent");
  const paymentSucceeded =
    ACCEPTED_REDIRECT_STATUSES.includes(searchParams.get("redirect_status") ?? "") &&
    Boolean(paymentIntent);

  useEffect(() => {
    if (!paymentSucceeded) return;

    let active = true;

    // Zamówienie istnieje od kliknięcia „Zapłać" — tu tylko prosimy serwer,
    // żeby je domknął. To samo robi webhook Stripe'a, więc wynik jest ten sam,
    // niezależnie od tego, która droga była pierwsza.
    fetch("/api/checkout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: paymentIntent }),
    })
      .then((r) => r.json())
      .then((data: CheckoutErrorResponse & { orderId?: number }) => {
        if (!active) return;
        if (data.orderId) {
          clearCart();
          setState({ status: "success", orderId: data.orderId });
        } else {
          setState({ status: "error", message: t(getOrderErrorKey(data.error)) });
        }
      })
      .catch(() => {
        if (!active) return;
        setState({ status: "error", message: t("connectionError") });
      });

    return () => {
      active = false;
    };
  }, [paymentSucceeded, paymentIntent, clearCart, t]);

  if (!paymentSucceeded) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <p className="text-sm text-[var(--color-error)]">{t("paymentFailed")}</p>
        <Link
          href="/checkout"
          className="text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
        >
          {t("backToCheckout")}
        </Link>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[var(--muted)]">{t("loading")}</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <p className="text-sm text-[var(--color-error)]">{state.message}</p>
        <Link
          href="/checkout"
          className="text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
        >
          {t("backToCheckout")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
      <p className="text-xs tracking-widest uppercase text-[var(--muted)]">
        {t("thankYou")}
      </p>
      <p className="text-sm">
        {t("orderReceived", { orderId: state.orderId })}
      </p>
      <Link
        href="/shop"
        className="inline-block text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
      >
        {t("backToShop")}
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  const t = useTranslations("success");

  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="text-sm text-[var(--muted)]">{t("loading")}</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
