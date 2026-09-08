"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OrderConfirmResult } from "@/contracts/server/order";

type State = { status: "loading" } | { status: "done"; result: OrderConfirmResult };

// Stripe odsyła tutaj po zapłacie za istniejące zamówienie. Numer płatności
// czytamy z adresu — tak samo jak na stronie potwierdzenia z kasy — ale sam
// adres niczego nie dowodzi: wynik ustala serwer, pytając Stripe'a.
export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const t = useTranslations("account");
  const [state, setState] = useState<State>({ status: "loading" });

  const orderId = Number(searchParams.get("order"));
  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() =>
        fetch("/api/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentIntentId: paymentIntentId ?? "" }),
        })
      )
      .then((res) => res.json())
      .then((data: { result?: OrderConfirmResult }) => {
        if (!active) return;
        setState({
          status: "done",
          result: data.result ?? OrderConfirmResult.NotConfirmed,
        });
      })
      .catch(() => {
        if (!active) return;
        setState({ status: "done", result: OrderConfirmResult.NotConfirmed });
      });

    return () => {
      active = false;
    };
  }, [orderId, paymentIntentId]);

  if (state.status === "loading") {
    return (
      <p className="border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--muted)]">
        {t("pay.confirming")}
      </p>
    );
  }

  const isPaid = state.result !== OrderConfirmResult.NotConfirmed;

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-sm tracking-widest uppercase">
        {isPaid ? t("pay.paidTitle") : t("pay.notConfirmedTitle")}
      </h2>

      <p
        className={
          isPaid
            ? "border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--muted)]"
            : "border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--color-error)]"
        }
      >
        {state.result === OrderConfirmResult.Paid && t("pay.paid")}
        {state.result === OrderConfirmResult.PaidNotRecorded &&
          t("pay.paidNotRecorded")}
        {state.result === OrderConfirmResult.NotConfirmed &&
          t("pay.notConfirmed")}
      </p>

      <Link
        href="/account/orders"
        className="text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
      >
        {t("pay.backToOrders")}
      </Link>
    </div>
  );
}
