"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import CheckoutForm from "./CheckoutForm";
import { Link } from "@/i18n/navigation";
import { CartItem, Address } from "@/contracts/server/cart";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { getShippingCost } from "@/lib/helpers/shipping";
import { getUnitPrice, getCartTotal, formatPrice } from "@/lib/helpers/currency";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const EMPTY_ADDRESS: Address = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  postcode: "",
  country: "PL",
  note: "",
};

export default function CheckoutPage() {
  const { items, itemCount } = useCart();
  const { currency } = useCurrency();
  const t = useTranslations("checkout");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  // Address lives here (not in the form) so it survives the Stripe Elements
  // remount that happens when the intent is recreated on currency change.
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  // Parcel-locker delivery is offered only for Poland. Method + selected locker
  // live here (not in the form) so they survive the Stripe Elements remount.
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    DeliveryMethod.Locker
  );
  const [locker, setLocker] = useState<InPostPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const country = address.country;
  const isPoland = country === "PL";
  const effectiveMethod = isPoland ? deliveryMethod : DeliveryMethod.Courier;
  const subtotal = getCartTotal(items, currency);
  const shippingCost = getShippingCost(country, currency);
  const grandTotal = subtotal + shippingCost;

  function setField(field: keyof Address, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  // Drop any selected locker when the customer leaves the Poland zone, where
  // parcel lockers aren't offered.
  useEffect(() => {
    if (!isPoland) setLocker(null);
  }, [isPoland]);

  // (Re)create the PaymentIntent whenever pricing inputs change. Stripe does
  // not allow changing an intent's currency after creation, so country and
  // currency changes recreate it; the new client secret remounts the form.
  useEffect(() => {
    if (items.length === 0) return;

    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, country, currency }),
    })
      .then((r) => r.json())
      .then((data: { error?: string; clientSecret?: string }) => {
        if (data.error) setError(data.error);
        else if (data.clientSecret) setClientSecret(data.clientSecret);
      })
      .catch(() => setError(t("connectionError")));
  }, [items, country, currency, t]);

  if (itemCount === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[var(--muted)] mb-6">{t("empty")}</p>
        <Link
          href="/shop"
          className="text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
        >
          {t("backToShop")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-widest uppercase mb-12">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          {error && <p className="text-sm text-red-600 mb-6">{error}</p>}
          {clientSecret ? (
            <Elements
              key={clientSecret}
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
              <CheckoutForm
                items={items}
                currency={currency}
                address={address}
                onFieldChange={setField}
                shippingCost={shippingCost}
                isPoland={isPoland}
                deliveryMethod={effectiveMethod}
                onDeliveryMethodChange={setDeliveryMethod}
                locker={locker}
                onLockerSelect={setLocker}
              />
            </Elements>
          ) : (
            !error && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-[var(--color-ceramic)] animate-pulse"
                  />
                ))}
              </div>
            )
          )}
        </div>

        <div>
          <p className="text-xs tracking-widest uppercase mb-6">
            {t("summary")}
          </p>
          <div className="space-y-4 mb-8">
            {items.map((item: CartItem) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">
                  {item.name}{" "}
                  {item.quantity > 1 && (
                    <span className="text-xs">× {item.quantity}</span>
                  )}
                </span>
                <span>
                  {formatPrice(
                    getUnitPrice(item, currency) * item.quantity,
                    currency
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">{t("shipping")}</span>
              <span>{formatPrice(shippingCost, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
                {t("total")}
              </span>
              <span className="text-sm">{formatPrice(grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
