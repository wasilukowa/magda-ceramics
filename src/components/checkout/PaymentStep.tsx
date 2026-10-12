"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Link, getPathname } from "@/i18n/navigation";
import { Address } from "@/contracts/server/cart";
import { PlacedCheckout } from "@/contracts/server/checkout";
import { InPostPoint } from "@/contracts/server/shipping";
import { ButtonSize, Currency } from "@/contracts/shared";
import { formatPrice } from "@/lib/helpers/currency";
import { formatDeadline } from "@/lib/helpers/date";
import { getCountryLabel } from "@/lib/helpers/shipping";
import { getStripeFonts } from "@/lib/helpers/stripeAppearance";
import { useStripeAppearance } from "@/hooks/useStripeAppearance";
import { ButtonArrow, buttonClass } from "@/components/ui/button";
import CheckoutActions from "./CheckoutActions";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Props = {
  checkout: PlacedCheckout;
  address: Address;
  // Paczkomat, jeśli zamówienie idzie do paczkomatu; null przy kurierze.
  locker: InPostPoint | null;
  deliveryLabel: string;
  pieces: number;
  total: number;
  currency: Currency;
  onBack: () => void;
  onEditContact: () => void;
  onEditShipping: () => void;
};

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("checkout");

  return (
    <div className="border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-widest uppercase text-[var(--muted)]">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="text-[10px] tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
        >
          {t("edit")}
        </button>
      </div>
      <div className="text-sm space-y-0.5">{children}</div>
    </div>
  );
}

function PaymentForm({
  checkout,
  address,
  locker,
  deliveryLabel,
  pieces,
  total,
  currency,
  onBack,
  onEditContact,
  onEditShipping,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    // Do paczkomatu adres to adres punktu — tak samo jak w zamówieniu.
    const billingAddress = locker
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

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${getPathname({ locale, href: "/checkout/success" })}`,
        payment_method_data: {
          billing_details: {
            name: `${address.firstName} ${address.lastName}`,
            email: address.email,
            phone: address.phone,
            address: billingAddress,
          },
        },
      },
    });

    // Tu wracamy tylko wtedy, gdy płatność się NIE udała (przy powodzeniu
    // przeglądarka jest już na stronie podsumowania). Zamówienie jest złożone,
    // więc klient zostaje na tym kroku i próbuje jeszcze raz, także inną metodą.
    if (stripeError) {
      setError(stripeError.message ?? t("connectionError"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-8">
        <p className="text-sm leading-relaxed">
          {checkout.reservedUntil
            ? t("orderPlaced", {
                number: checkout.number,
                count: pieces,
                deadline: formatDeadline(checkout.reservedUntil, locale),
              })
            : t("orderPlacedShort", { number: checkout.number })}
        </p>

        <div className="space-y-3">
          <ReviewBlock title={t("contactDetails")} onEdit={onEditContact}>
            <p>
              {address.firstName} {address.lastName}
            </p>
            <p className="text-[var(--muted)]">{address.email}</p>
            {address.phone && <p className="text-[var(--muted)]">{address.phone}</p>}
          </ReviewBlock>

          <ReviewBlock title={t("deliveryMethod")} onEdit={onEditShipping}>
            <p>{deliveryLabel}</p>
            <p className="text-[var(--muted)]">
              {locker
                ? `${locker.description || locker.code} · ${locker.city}`
                : [
                    address.street,
                    address.street2,
                    `${address.postcode} ${address.city}`,
                    getCountryLabel(address.country, locale),
                  ]
                    .filter(Boolean)
                    .join(", ")}
            </p>
          </ReviewBlock>
        </div>

        <div>
          <p className="text-xs tracking-widest uppercase mb-5">{t("payment")}</p>
          <PaymentElement />
        </div>
      </div>

      <CheckoutActions
        onBack={onBack}
        primaryLabel={t("payButton", { total: formatPrice(total, currency) })}
        accent
        disabled={!stripe}
        loading={loading}
        error={error}
        hint={t("stripeNote")}
      />
    </form>
  );
}

// Krok 3 kasy: płatność za złożone zamówienie. Płatność w Stripe powstała
// DLA tego zamówienia (po „Złóż zamówienie" albo „Zapisz zmiany"), więc
// formularz montuje się od nowa przy każdej nowej — klucz `clientSecret`.
export default function PaymentStep(props: Props) {
  const t = useTranslations("checkout");
  const stripeAppearance = useStripeAppearance();
  const { checkout } = props;

  if (!checkout.clientSecret) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-[var(--color-error)]">{t("paymentUnavailable")}</p>
        <Link
          href={{ pathname: "/order", query: { id: checkout.orderId, key: checkout.key } }}
          className={buttonClass({ size: ButtonSize.Block })}
        >
          {t("goToOrder")}
          <ButtonArrow />
        </Link>
      </div>
    );
  }

  return (
    <Elements
      key={checkout.clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret: checkout.clientSecret,
        fonts: getStripeFonts(),
        appearance: stripeAppearance,
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}
