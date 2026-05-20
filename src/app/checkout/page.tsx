"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import CheckoutForm from "./CheckoutForm";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const { items, total, itemCount } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setClientSecret(data.clientSecret);
      })
      .catch(() => setError("Błąd połączenia. Spróbuj ponownie."));
  }, [items]);

  if (itemCount === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[var(--muted)] mb-6">
          Twój koszyk jest pusty.
        </p>
        <Link
          href="/sklep"
          className="text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
        >
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-widest uppercase mb-12">Zamówienie</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Lewa: formularz */}
        <div>
          {error && (
            <p className="text-sm text-red-600 mb-6">{error}</p>
          )}
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "flat",
                  variables: {
                    fontFamily: "var(--font-montserrat), sans-serif",
                    colorBackground: "var(--background)",
                    colorText: "var(--foreground)",
                    colorTextPlaceholder: "#9ca3af",
                    borderRadius: "0px",
                    fontSizeBase: "13px",
                  },
                  rules: {
                    ".Input": {
                      border: "1px solid var(--border)",
                      padding: "12px",
                    },
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
                },
              }}
            >
              <CheckoutForm items={items} />
            </Elements>
          ) : (
            !error && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-[#e8e0d5] animate-pulse"
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Prawa: podsumowanie */}
        <div>
          <p className="text-xs tracking-widest uppercase mb-6">Podsumowanie</p>
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">
                  {item.name}{" "}
                  {item.quantity > 1 && (
                    <span className="text-xs">× {item.quantity}</span>
                  )}
                </span>
                <span>
                  {(parseFloat(item.price) * item.quantity).toFixed(2)} zł
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] pt-4 flex justify-between">
            <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
              Suma
            </span>
            <span className="text-sm">{total.toFixed(2)} zł</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            + koszt wysyłki zostanie doliczony
          </p>
        </div>
      </div>
    </div>
  );
}
