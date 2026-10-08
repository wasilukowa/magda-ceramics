"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useCart } from "@/hooks/useCart";
import { CheckoutErrorResponse } from "@/contracts/server/checkout";
import { CheckoutReturn, OrderCompletion } from "@/contracts/server/order";
import { getOrderErrorKey } from "@/lib/helpers/checkout";
import { ButtonArrow, buttonClass } from "@/components/ui/button";

type OrderState =
  | { status: "loading" }
  | { status: "success"; orderId: number }
  | { status: "error"; message: string };

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const t = useTranslations("success");
  const [state, setState] = useState<OrderState>({ status: "loading" });

  // Stripe odsyła tu klienta z numerem płatności, jej „client secret"
  // i wynikiem w adresie. Zamówienie jest złożone od kliknięcia w kasie —
  // niezależnie od wyniku płatności.
  const paymentIntent = searchParams.get("payment_intent");
  const clientSecret = searchParams.get("payment_intent_client_secret");

  useEffect(() => {
    if (!paymentIntent) return;

    let active = true;

    fetch("/api/checkout/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: paymentIntent,
        ...(clientSecret ? { clientSecret } : {}),
      }),
    })
      .then((r) => r.json())
      .then((data: Partial<CheckoutErrorResponse & CheckoutReturn>) => {
        if (!active) return;
        if (!data.orderId) {
          setState({ status: "error", message: t(getOrderErrorKey(data.error)) });
          return;
        }
        // Prace z koszyka są już w złożonym zamówieniu, zarezerwowane dla tego
        // klienta — także wtedy, gdy płatność nie przeszła.
        clearCart();
        if (data.completion === OrderCompletion.Unpaid && data.key) {
          // Druga próba na stronie zamówienia — tej samej, do której prowadzi
          // link z maila.
          router.replace({
            pathname: "/order",
            query: { id: data.orderId, key: data.key, retry: "1" },
          });
          return;
        }
        setState({ status: "success", orderId: data.orderId });
      })
      .catch(() => {
        if (!active) return;
        setState({ status: "error", message: t("connectionError") });
      });

    return () => {
      active = false;
    };
  }, [paymentIntent, clientSecret, clearCart, router, t]);

  // Bez numeru płatności w adresie nie ma o co pytać — wynik widać od razu.
  const shown: OrderState = paymentIntent
    ? state
    : { status: "error", message: t("paymentNotVerified") };

  if (shown.status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[var(--muted)]">{t("loading")}</p>
      </div>
    );
  }

  if (shown.status === "error") {
    // Zamówienie najpewniej jest złożone (powstaje przed płatnością), tylko
    // nie udało się tego tu potwierdzić — link do zapłaty klient ma w mailu.
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <p className="text-sm text-[var(--color-error)]">{shown.message}</p>
        <p className="text-sm text-[var(--muted)] leading-relaxed">{t("checkEmail")}</p>
        <Link href="/shop" className={buttonClass()}>
          {t("backToShop")}
          <ButtonArrow />
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
        {t("orderReceived", { orderId: shown.orderId })}
      </p>
      <Link
        href="/shop"
        className={buttonClass()}
      >
        {t("backToShop")}
        <ButtonArrow />
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
