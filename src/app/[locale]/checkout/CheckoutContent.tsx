"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { CartItem, Address } from "@/contracts/server/cart";
import { Currency } from "@/contracts/shared";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { CheckoutStep } from "@/contracts/server/checkout";
import { getCartTotal } from "@/lib/helpers/currency";
import { cn } from "@/lib/utils";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import OrderSummary from "@/components/checkout/OrderSummary";
import CheckoutForm from "./CheckoutForm";

type Props = {
  items: CartItem[];
  currency: Currency;
  address: Address;
  onFieldChange: (field: keyof Address, value: string) => void;
  shippingCost: number;
  grandTotal: number;
  isPoland: boolean;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  locker: InPostPoint | null;
  onLockerSelect: (point: InPostPoint) => void;
  deliveryLabel: string;
};

const primaryButtonClass =
  "w-full bg-[var(--foreground)] text-[var(--background)] text-xs tracking-widest uppercase py-4 hover:opacity-80 transition-opacity disabled:opacity-40";

const secondaryButtonClass =
  "w-full border border-[var(--border)] text-xs tracking-widest uppercase py-4 hover:border-[var(--foreground)] transition-colors";

export default function CheckoutContent({
  items,
  currency,
  address,
  onFieldChange,
  shippingCost,
  grandTotal,
  isPoland,
  deliveryMethod,
  onDeliveryMethodChange,
  locker,
  onLockerSelect,
  deliveryLabel,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.Address);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingLocker = isPoland && deliveryMethod === DeliveryMethod.Locker;

  // Every required field for the chosen delivery method is filled in. Drives
  // both the "continue" button's enabled state and step-1 validation.
  const isAddressComplete =
    !!address.firstName &&
    !!address.lastName &&
    !!address.email &&
    (usingLocker
      ? !!locker
      : !!address.street && !!address.postcode && !!address.city);

  function goToStep(target: CheckoutStep) {
    setError(null);
    setStep(target);
  }

  function handleAddressNext() {
    if (!isAddressComplete) {
      setError(usingLocker && !locker ? t("lockerRequired") : t("fillRequired"));
      return;
    }
    goToStep(CheckoutStep.Payment);
  }

  // Ask Stripe to validate the payment details before the overview so the
  // customer fixes card errors before the final confirmation.
  async function handlePaymentNext() {
    if (!stripe || !elements) return;
    setError(null);
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? t("connectionError"));
      return;
    }
    goToStep(CheckoutStep.Overview);
  }

  async function handlePay() {
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

  // The primary button is a form submit so Enter advances the current step too.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === CheckoutStep.Address) handleAddressNext();
    else if (step === CheckoutStep.Payment) handlePaymentNext();
    else handlePay();
  }

  const stepLabels = [t("stepAddress"), t("stepPayment"), t("stepOverview")];

  const isOverview = step === CheckoutStep.Overview;
  const primaryLabel = isOverview
    ? loading
      ? t("processing")
      : t("payButton")
    : t("continue");
  const primaryDisabled =
    step === CheckoutStep.Address
      ? !isAddressComplete
      : !stripe || (isOverview && loading);

  const footer = (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div
        className={cn(
          step !== CheckoutStep.Address && "grid grid-cols-2 gap-4"
        )}
      >
        {step !== CheckoutStep.Address && (
          <button
            type="button"
            onClick={() =>
              goToStep(
                isOverview ? CheckoutStep.Payment : CheckoutStep.Address
              )
            }
            className={secondaryButtonClass}
          >
            {t("back")}
          </button>
        )}
        <button
          type="submit"
          disabled={primaryDisabled}
          className={primaryButtonClass}
        >
          {primaryLabel}
        </button>
      </div>

      {isOverview && (
        <p className="text-xs text-[var(--muted)] text-center">
          {t("stripeNote")}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <CheckoutStepper
            steps={stepLabels}
            current={step}
            onSelect={(index) => goToStep(index as CheckoutStep)}
          />
          <CheckoutForm
            step={step}
            address={address}
            onFieldChange={onFieldChange}
            isPoland={isPoland}
            deliveryMethod={deliveryMethod}
            onDeliveryMethodChange={onDeliveryMethodChange}
            locker={locker}
            onLockerSelect={onLockerSelect}
            deliveryLabel={deliveryLabel}
            onEditAddress={() => goToStep(CheckoutStep.Address)}
          />
        </div>

        <OrderSummary
          items={items}
          currency={currency}
          shippingCost={shippingCost}
          grandTotal={grandTotal}
          deliveryLabel={deliveryLabel}
          footer={footer}
        />
      </div>
    </form>
  );
}
