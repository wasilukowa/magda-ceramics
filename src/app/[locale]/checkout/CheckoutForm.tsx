"use client";

import { PaymentElement } from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";
import { Address } from "@/contracts/server/cart";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { CheckoutStep } from "@/contracts/server/checkout";
import { CHECKOUT_COUNTRIES } from "@/content/data";
import { cn } from "@/lib/utils";
import ParcelLockerField from "@/components/checkout/ParcelLockerField";

type Props = {
  step: CheckoutStep;
  address: Address;
  onFieldChange: (field: keyof Address, value: string) => void;
  isPoland: boolean;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  locker: InPostPoint | null;
  onLockerSelect: (point: InPostPoint) => void;
  deliveryLabel: string;
  onEditAddress: () => void;
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

function ReviewBlock({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-widest uppercase text-[var(--muted)]">
          {title}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="text-[10px] tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
        >
          {editLabel}
        </button>
      </div>
      <div className="text-sm space-y-0.5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full border border-[var(--border)] px-3 py-3 text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors";

// Renders the fields for the active checkout step. Step state, Stripe actions
// and navigation live in the parent (CheckoutContent).
export default function CheckoutForm({
  step,
  address,
  onFieldChange,
  isPoland,
  deliveryMethod,
  onDeliveryMethodChange,
  locker,
  onLockerSelect,
  deliveryLabel,
  onEditAddress,
}: Props) {
  const t = useTranslations("checkout");

  const usingLocker = isPoland && deliveryMethod === DeliveryMethod.Locker;
  const countryLabel =
    CHECKOUT_COUNTRIES.find((c) => c.code === address.country)?.label ??
    address.country;

  function set(field: keyof Address) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => onFieldChange(field, e.target.value);
  }

  return (
    <div className="space-y-8">
      {/* STEP 1 — contact details + shipping address. Hidden (not unmounted) so
          the InPost geowidget keeps its state when stepping back and forth. */}
      <div
        className={cn(
          "space-y-8",
          step !== CheckoutStep.Address && "hidden"
        )}
      >
        <div>
          <p className="text-xs tracking-widest uppercase mb-5">
            {t("contactDetails")}
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("firstName")}>
                <input
                  value={address.firstName}
                  onChange={set("firstName")}
                  className={inputClass}
                  autoComplete="given-name"
                />
              </Field>
              <Field label={t("lastName")}>
                <input
                  value={address.lastName}
                  onChange={set("lastName")}
                  className={inputClass}
                  autoComplete="family-name"
                />
              </Field>
            </div>
            <Field label={t("emailLabel")}>
              <input
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
                {[DeliveryMethod.Locker, DeliveryMethod.Courier].map(
                  (method) => (
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
                  )
                )}
              </div>
            )}

            {usingLocker ? (
              <ParcelLockerField locker={locker} onSelect={onLockerSelect} />
            ) : (
              <>
                <Field label={t("street")}>
                  <input
                    value={address.street}
                    onChange={set("street")}
                    className={inputClass}
                    autoComplete="street-address"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("postcode")}>
                    <input
                      value={address.postcode}
                      onChange={set("postcode")}
                      className={inputClass}
                      autoComplete="postal-code"
                    />
                  </Field>
                  <Field label={t("city")}>
                    <input
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
      </div>

      {/* STEP 2 — payment. Kept mounted (hidden) across steps so the Stripe
          PaymentElement never loses its internal state. */}
      <div className={cn(step !== CheckoutStep.Payment && "hidden")}>
        <p className="text-xs tracking-widest uppercase mb-5">{t("payment")}</p>
        <PaymentElement />
      </div>

      {/* STEP 3 — overview / final confirmation. */}
      {step === CheckoutStep.Overview && (
        <div className="space-y-8">
          <div className="space-y-3">
            <ReviewBlock
              title={t("contactDetails")}
              editLabel={t("edit")}
              onEdit={onEditAddress}
            >
              <p>
                {address.firstName} {address.lastName}
              </p>
              <p className="text-[var(--muted)]">{address.email}</p>
              {address.phone && (
                <p className="text-[var(--muted)]">{address.phone}</p>
              )}
            </ReviewBlock>

            <ReviewBlock
              title={t("deliveryMethod")}
              editLabel={t("edit")}
              onEdit={onEditAddress}
            >
              <p>{deliveryLabel}</p>
              {usingLocker && locker ? (
                <p className="text-[var(--muted)]">
                  {locker.description || locker.code} · {locker.city}
                </p>
              ) : (
                <p className="text-[var(--muted)]">
                  {address.street}, {address.postcode} {address.city},{" "}
                  {countryLabel}
                </p>
              )}
            </ReviewBlock>
          </div>

          <Field label={t("note")}>
            <textarea
              value={address.note}
              onChange={set("note")}
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
