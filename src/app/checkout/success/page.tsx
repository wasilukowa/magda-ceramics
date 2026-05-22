"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

type OrderState =
  | { status: "loading" }
  | { status: "success"; orderId: number }
  | { status: "error"; message: string };

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [state, setState] = useState<OrderState>({ status: "loading" });

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");

    if (redirectStatus !== "succeeded" || !paymentIntent) {
      setState({ status: "error", message: "Payment failed or was cancelled." });
      return;
    }

    const raw = sessionStorage.getItem("pendingOrder");
    if (!raw) {
      setState({ status: "error", message: "Order data not found." });
      return;
    }

    const { billing, items } = JSON.parse(raw);

    fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing, items, paymentIntentId: paymentIntent }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState({ status: "error", message: data.error });
        } else {
          sessionStorage.removeItem("pendingOrder");
          clearCart();
          setState({ status: "success", orderId: data.orderId });
        }
      })
      .catch(() =>
        setState({ status: "error", message: "Connection error while creating the order." })
      );
  }, [searchParams, clearCart]);

  if (state.status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[var(--muted)]">Finalising your order...</p>
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
          Back to checkout
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
      <p className="text-xs tracking-widest uppercase text-[var(--muted)]">
        Thank you for your order
      </p>
      <p className="text-sm">
        Order #{state.orderId} has been received. A confirmation has been sent to your email address.
      </p>
      <Link
        href="/sklep"
        className="inline-block text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
      >
        Back to shop
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="text-sm text-[var(--muted)]">Finalising your order...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
