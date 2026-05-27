"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CartItem, Address } from "@/contracts/server/cart";
import { CHECKOUT_COUNTRIES } from "@/content/data";
import { cn } from "@/lib/utils";

type Props = {
  items: CartItem[];
};

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

export default function CheckoutForm({ items }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof Address) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setAddress((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    sessionStorage.setItem(
      "pendingOrder",
      JSON.stringify({
        billing: {
          first_name: address.firstName,
          last_name: address.lastName,
          email: address.email,
          phone: address.phone,
          address_1: address.street,
          city: address.city,
          postcode: address.postcode,
          country: address.country,
        },
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        note: address.note,
      })
    );

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: {
          billing_details: {
            name: `${address.firstName} ${address.lastName}`,
            email: address.email,
            phone: address.phone,
            address: {
              line1: address.street,
              city: address.city,
              postal_code: address.postcode,
              country: address.country,
            },
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
      {/* Contact details */}
      <div>
        <p className="text-xs tracking-widest uppercase mb-5">Contact details</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name *">
              <input required value={address.firstName} onChange={set("firstName")} className={inputClass} autoComplete="given-name" />
            </Field>
            <Field label="Last name *">
              <input required value={address.lastName} onChange={set("lastName")} className={inputClass} autoComplete="family-name" />
            </Field>
          </div>
          <Field label="E-mail *">
            <input required type="email" value={address.email} onChange={set("email")} className={inputClass} autoComplete="email" />
          </Field>
          <Field label="Phone">
            <input type="tel" value={address.phone} onChange={set("phone")} className={inputClass} autoComplete="tel" />
          </Field>
        </div>
      </div>

      {/* Shipping address */}
      <div>
        <p className="text-xs tracking-widest uppercase mb-5">Shipping address</p>
        <div className="space-y-4">
          <Field label="Country *">
            <select required value={address.country} onChange={set("country")} className={inputClass}>
              {CHECKOUT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Street address *">
            <input required value={address.street} onChange={set("street")} className={inputClass} autoComplete="street-address" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Postcode *">
              <input required value={address.postcode} onChange={set("postcode")} className={inputClass} autoComplete="postal-code" />
            </Field>
            <Field label="City *">
              <input required value={address.city} onChange={set("city")} className={inputClass} autoComplete="address-level2" />
            </Field>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div>
        <p className="text-xs tracking-widest uppercase mb-5">Payment</p>
        <PaymentElement />
      </div>

      {/* Note */}
      <div>
        <Field label="Order note (optional)">
          <textarea value={address.note} onChange={set("note")} rows={3} className={cn(inputClass, "resize-none")} />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {loading ? "Processing..." : "Pay & order"}
      </button>

      <p className="text-xs text-[var(--muted)] text-center">
        Payment powered by Stripe — secure SSL connection
      </p>
    </form>
  );
}
