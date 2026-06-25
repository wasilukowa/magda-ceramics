"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CartItem, Address } from "@/contracts/server/cart";
import { Currency } from "@/contracts/shared";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { CHECKOUT_COUNTRIES } from "@/content/data";
import { getCartTotal } from "@/lib/helpers/currency";
import { cn } from "@/lib/utils";
import ParcelLockerField from "@/components/checkout/ParcelLockerField";

type Props = {
  items: CartItem[];
  currency: Currency;
  address: Address;
  onFieldChange: (field: keyof Address, value: string) => void;
  shippingCost: number;
  isPoland: boolean;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  locker: InPostPoint | null;
  onLockerSelect: (point: InPostPoint) => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest uppercase text-[var(--muted)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-[var(--border)] px-3 py-3 text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors";

export default function CheckoutForm({
  items,
  currency,
  address,
  onFieldChange,
  shippingCost,
  isPoland,
  deliveryMethod,
  onDeliveryMethodChange,
  locker,
  onLockerSelect,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingLocker = isPoland && deliveryMethod === DeliveryMethod.Locker;

  function set(field: keyof Address) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => onFieldChange(field, e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (usingLocker && !locker) {
      setError(t("lockerRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    const paidTotal = getCartTotal(items, currency) + shippingCost;

    // For locker delivery the address fields are blank; fall back to the
    // locker's own address so Stripe and WooCommerce have a valid destination.
    const shippingAddress =
      usingLocker && locker
        ? {
            line1: locker.description || locker.code,
            city: locker.city,
            postal_code: locker.postCode,
            country: "PL",
          }
        : {
            line1: address.street,
            city: address.city,
            postal_code: address.postcode,
            country: address.country,
          };

    sessionStorage.setItem(
      "pendingOrder",
      JSON.stringify({
        billing: {
          first_name: address.firstName,
          last_name: address.lastName,
          email: address.email,
          phone: address.phone,
          address_1: shippingAddress.line1,
          city: shippingAddress.city,
          postcode: shippingAddress.postal_code,
          country: shippingAddress.country,
        },
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        note: address.note,
        currency,
        paidTotal,
        deliveryMethod,
        locker: usingLocker ? locker : null,
      })
    );

    const localePrefix = locale === "en" ? "" : `/${locale}`;
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${localePrefix}/checkout/success`,
        payment_method_data: {
          billing_details: {
            name: `${address.firstName} ${address.lastName}`,
            email: address.email,
            phone: address.phone,
            address: shippingAddress,
          },
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "A payment error occurred.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase mb-5">
          {t("contactDetails")}
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("firstName")}>
              <input
                required
                value={address.firstName}
                onChange={set("firstName")}
                className={inputClass}
                autoComplete="given-name"
              />
            </Field>
            <Field label={t("lastName")}>
              <input
                required
                value={address.lastName}
                onChange={set("lastName")}
                className={inputClass}
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field label={t("emailLabel")}>
            <input
              required
              type="email"
              value={address.email}
              onChange={set("email")}
              className={inputClass}
              autoComplete="email"
            />
          </Field>
          <Field label={t("phone")}>
            <input
              type="tel"
              value={address.phone}
              onChange={set("phone")}
              className={inputClass}
              autoComplete="tel"
            />
          </Field>
        </div>
      </div>

      <div>
        <p className="text-xs tracking-widest uppercase mb-5">
          {t("shippingAddress")}
        </p>
        <div className="space-y-4">
          <Field label={t("country")}>
            <select
              required
              value={address.country}
              onChange={set("country")}
              className={inputClass}
            >
              {CHECKOUT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          {isPoland && (
            <div className="grid grid-cols-2 gap-2">
              {[DeliveryMethod.Locker, DeliveryMethod.Courier].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => onDeliveryMethodChange(method)}
                  className={cn(
                    "border px-3 py-3 text-[10px] tracking-widest uppercase transition-colors",
                    deliveryMethod === method
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] hover:border-[var(--foreground)]"
                  )}
                >
                  {method === DeliveryMethod.Locker
                    ? t("methodLocker")
                    : t("methodCourier")}
                </button>
              ))}
            </div>
          )}

          {usingLocker ? (
            <ParcelLockerField locker={locker} onSelect={onLockerSelect} />
          ) : (
            <>
              <Field label={t("street")}>
                <input
                  required
                  value={address.street}
                  onChange={set("street")}
                  className={inputClass}
                  autoComplete="street-address"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("postcode")}>
                  <input
                    required
                    value={address.postcode}
                    onChange={set("postcode")}
                    className={inputClass}
                    autoComplete="postal-code"
                  />
                </Field>
                <Field label={t("city")}>
                  <input
                    required
                    value={address.city}
                    onChange={set("city")}
                    className={inputClass}
                    autoComplete="address-level2"
                  />
                </Field>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs tracking-widest uppercase mb-5">{t("payment")}</p>
        <PaymentElement />
      </div>

      <div>
        <Field label={t("note")}>
          <textarea
            value={address.note}
            onChange={set("note")}
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {loading ? t("processing") : t("payButton")}
      </button>

      <p className="text-xs text-[var(--muted)] text-center">{t("stripeNote")}</p>
    </form>
  );
}
