"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/hooks/useCart";
import { BillingAddress, OrderItem } from "@/contracts/server/cart";

type OrderState =
  | { status: "loading" }
  | { status: "success"; orderId: number }
  | { status: "error"; message: string };

type PendingOrder = {
  billing: BillingAddress;
  items: OrderItem[];
  note: string;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const t = useTranslations("success");
  const [state, setState] = useState<OrderState>({ status: "loading" });

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");

    if (redirectStatus !== "succeeded" || !paymentIntent) {
      setState({ status: "error", message: t("paymentFailed") });
      return;
    }

    const raw = sessionStorage.getItem("pendingOrder");
    if (!raw) {
      setState({ status: "error", message: t("orderNotFound") });
      return;
    }

    const { billing, items }: PendingOrder = JSON.parse(raw);

    fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing, items, paymentIntentId: paymentIntent }),
    })
      .then((r) => r.json())
      .then((data: { error?: string; orderId?: number }) => {
        if (data.error) {
          setState({ status: "error", message: data.error });
        } else if (data.orderId) {
          sessionStorage.removeItem("pendingOrder");
          clearCart();
          setState({ status: "success", orderId: data.orderId });
        }
      })
      .catch(() =>
        setState({ status: "error", message: t("connectionError") })
      );
  }, [searchParams, clearCart, t]);

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
        <p className="text-sm text-red-600">{state.message}</p>
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
