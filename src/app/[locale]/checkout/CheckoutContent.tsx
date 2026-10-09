"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { getPathname, useRouter } from "@/i18n/navigation";
import { useCart } from "@/hooks/useCart";
import { CartItem, Address } from "@/contracts/server/cart";
import { ButtonSize, ButtonVariant, Currency } from "@/contracts/shared";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import {
  CheckoutError,
  CheckoutErrorResponse,
  CheckoutStep,
  UnavailableItem,
} from "@/contracts/server/checkout";
import { getOrderItems, getSoldOutItems } from "@/lib/helpers/checkout";
import { cn } from "@/lib/utils";
import { isPhoneNumber } from "@/utility";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import OrderSummary from "@/components/checkout/OrderSummary";
import CheckoutForm from "./CheckoutForm";
import { ButtonArrow, buttonClass } from "@/components/ui/button";

type Props = {
  items: CartItem[];
  currency: Currency;
  address: Address;
  onFieldChange: (field: keyof Address, value: string) => void;
  shippingCost: number;
  grandTotal: number;
  hasLocker: boolean;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  locker: InPostPoint | null;
  onLockerSelect: (point: InPostPoint) => void;
  deliveryLabel: string;
  // Prace sprzedane w międzyczasie — kasa pokazuje je zamiast formularza.
  onSoldOut: (items: UnavailableItem[]) => void;
  // Płatność w Stripe, do której kasa przypina zamówienie przed zapłatą.
  paymentIntentId: string;
};

const primaryButtonClass = buttonClass({ size: ButtonSize.Block });

const secondaryButtonClass = buttonClass({
  variant: ButtonVariant.Secondary,
  size: ButtonSize.Block,
});

export default function CheckoutContent({
  items,
  currency,
  address,
  onFieldChange,
  shippingCost,
  grandTotal,
  hasLocker,
  deliveryMethod,
  onDeliveryMethodChange,
  locker,
  onLockerSelect,
  deliveryLabel,
  onSoldOut,
  paymentIntentId,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.Address);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingLocker = hasLocker && deliveryMethod === DeliveryMethod.Locker;

  // Every required field for the chosen delivery method is filled in. Drives
  // both the "continue" button's enabled state and step-1 validation.
  // Do paczkomatu telefon jest obowiązkowy — InPost wysyła na niego SMS
  // z kodem odbioru (decyzja Natalii 2026-10-07). Przy kurierze zostaje
  // nieobowiązkowy.
  const isAddressComplete =
    !!address.firstName &&
    !!address.lastName &&
    !!address.email &&
    (usingLocker
      ? !!locker && isPhoneNumber(address.phone)
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

    // Ceramika to pojedyncze sztuki, a wypełnianie adresu potrafi zająć
    // kilkanaście minut. Ostatnie spojrzenie na magazyn tuż przed obciążeniem
    // karty — żeby dwie osoby nie zapłaciły za tę samą pracę.
    const soldOut = await getSoldOutItems(items);
    if (soldOut.length) {
      onSoldOut(soldOut);
      setLoading(false);
      return;
    }

    // For locker delivery the address fields are blank; fall back to the
    // locker's own address so Stripe and WooCommerce have a valid destination.
    const shippingAddress =
      usingLocker && locker
        ? {
            line1: locker.description || locker.code,
            city: locker.city,
            postal_code: locker.postCode,
            country: address.country,
          }
        : {
            line1: address.street,
            line2: address.street2,
            city: address.city,
            postal_code: address.postcode,
            country: address.country,
          };

    // Zamówienie SKŁADA SIĘ na serwerze PRZED obciążeniem karty (decyzja
    // Natalii 2026-10-08): od tej chwili istnieje, klient dostaje maila,
    // a praca czeka na niego 48 h. Zamówienie jest przypięte do płatności
    // w Stripe, więc nie ginie, gdy klient po zapłacie nie wróci do tej karty
    // — BLIK i przelewy na telefonie otwierają aplikację banku i potrafią
    // wrócić gdzie indziej.
    const placed = await fetch("/api/checkout/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billing: {
          first_name: address.firstName,
          last_name: address.lastName,
          email: address.email,
          phone: address.phone,
          address_1: shippingAddress.line1,
          address_2: usingLocker ? "" : address.street2,
          city: shippingAddress.city,
          postcode: shippingAddress.postal_code,
          country: shippingAddress.country,
        },
        items: getOrderItems(items),
        note: address.note,
        paymentIntentId,
        deliveryMethod,
        locker: usingLocker ? locker : null,
        locale,
      }),
    })
      .then(async (r) =>
        (await r.json()) as CheckoutErrorResponse & { orderId?: number; key?: string }
      )
      .catch(() => null);

    if (placed?.error === CheckoutError.Unavailable && placed.unavailable?.length) {
      onSoldOut(placed.unavailable);
      setLoading(false);
      return;
    }
    if (!placed?.orderId || !placed.key) {
      setError(t("connectionError"));
      setLoading(false);
      return;
    }

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${getPathname({ locale, href: "/checkout/success" })}`,
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

    // Tu wracamy tylko wtedy, gdy płatność się NIE udała (przy powodzeniu
    // przeglądarka jest już na stronie potwierdzenia). Zamówienie jest jednak
    // złożone, a prace zarezerwowane dla tego klienta — w koszyku nie mają już
    // czego szukać. Druga próba odbywa się na stronie zamówienia, tej samej,
    // do której prowadzi link z maila.
    if (stripeError) {
      clearCart();
      router.replace({
        pathname: "/order",
        query: { id: placed.orderId, key: placed.key, retry: "1" },
      });
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
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

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
          {!loading && <ButtonArrow />}
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
            hasLocker={hasLocker}
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
