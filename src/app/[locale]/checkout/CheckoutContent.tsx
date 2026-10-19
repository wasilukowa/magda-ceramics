"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CartItem, Address } from "@/contracts/server/cart";
import { SavedDelivery } from "@/contracts/server/auth";
import { Currency } from "@/contracts/shared";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import {
  CheckoutError,
  CheckoutPlacement,
  CheckoutStep,
  PlacedCheckout,
  UnavailableItem,
} from "@/contracts/server/checkout";
import {
  getBillingAddress,
  getCheckoutErrorKey,
  getDeliverySnapshot,
  getOrderItems,
  sendCheckoutOrder,
} from "@/lib/helpers/checkout";
import { cn } from "@/lib/utils";
import { isEmailAddress, isPhoneNumber, isPlacedCheckout } from "@/utility";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import CheckoutActions from "@/components/checkout/CheckoutActions";
import ContactFields from "@/components/checkout/ContactFields";
import ShippingFields from "@/components/checkout/ShippingFields";
import PaymentStep from "@/components/checkout/PaymentStep";
import OrderSummary from "@/components/checkout/OrderSummary";

type Props = {
  items: CartItem[];
  currency: Currency;
  address: Address;
  onFieldChange: (field: keyof Address, value: string) => void;
  hasLocker: boolean;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  locker: InPostPoint | null;
  onLockerSelect: (point: InPostPoint) => void;
  // Adresy i paczkomaty z konta zalogowanego klienta — patrz ShippingFields.
  saved: SavedDelivery | null;
  canSave: boolean;
  onSavedChange: (saved: SavedDelivery) => void;
  deliveryLabel: string;
  shippingCost: number;
  grandTotal: number;
  // Null, dopóki klient nie kliknie „Złóż zamówienie".
  placement: CheckoutPlacement | null;
  onPlaced: (checkout: PlacedCheckout, details: string) => void;
  // Prace sprzedane w międzyczasie — kasa pokazuje je zamiast formularza.
  onSoldOut: (items: UnavailableItem[]) => void;
  // „Wstecz" z pierwszego kroku.
  onLeave: () => void;
};

const STEP_HEADING_CLASS = "text-xs tracking-widest uppercase mb-5";

// Kroki kasy (decyzja Natalii 2026-10-12): Dane kontaktowe → Wysyłka
// („Złóż zamówienie") → Płatność („Zapłać") → Podsumowanie (strona po
// zapłacie). Zamówienie powstaje na końcu kroku „Wysyłka", jawnie, przed
// płatnością. „Wstecz" z płatności pozwala poprawić to samo zamówienie —
// przycisk zmienia się wtedy na „Zapisz zmiany".
export default function CheckoutContent({
  items,
  currency,
  address,
  onFieldChange,
  hasLocker,
  deliveryMethod,
  onDeliveryMethodChange,
  locker,
  onLockerSelect,
  saved,
  canSave,
  onSavedChange,
  deliveryLabel,
  shippingCost,
  grandTotal,
  placement,
  onPlaced,
  onSoldOut,
  onLeave,
}: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.Contact);
  // Czy klient doszedł już do wyboru dostawy — od tej chwili podsumowanie
  // pokazuje koszt wysyłki i sumę, a pasek kroków pozwala tam wrócić.
  const [shippingReached, setShippingReached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Numer tej wizyty w kasie — nadawany przy pierwszym „Złóż zamówienie", nie
  // przy rysowaniu strony (prerender nie znosi losowych wartości).
  const checkoutId = useRef<string | null>(null);

  const chosenLocker = hasLocker && deliveryMethod === DeliveryMethod.Locker ? locker : null;
  const usingLocker = hasLocker && deliveryMethod === DeliveryMethod.Locker;
  const details = getDeliverySnapshot(address, deliveryMethod, chosenLocker);
  const dirty = placement !== null && details !== placement.details;
  const pieces = items.reduce((sum, item) => sum + item.quantity, 0);

  const isContactComplete =
    !!address.firstName.trim() && !!address.lastName.trim() && isEmailAddress(address.email);
  // Do paczkomatu telefon jest obowiązkowy — InPost wysyła na niego SMS
  // z kodem odbioru (decyzja Natalii 2026-10-07). Przy kurierze zostaje
  // nieobowiązkowy.
  const isShippingComplete = usingLocker
    ? !!locker && isPhoneNumber(address.phone)
    : !!address.street.trim() && !!address.postcode.trim() && !!address.city.trim();

  // Najdalszy krok, na który wolno przejść paskiem kroków. „Płatność" dopiero
  // po złożeniu zamówienia i tylko bez niezapisanych zmian.
  const reachable = placement
    ? dirty
      ? CheckoutStep.Shipping
      : CheckoutStep.Payment
    : shippingReached
      ? CheckoutStep.Shipping
      : CheckoutStep.Contact;

  // Nowy krok zaczyna się od góry — przyciski stoją pod formularzem, więc bez
  // tego klient zostawał na dole strony, przy stopce.
  function goToStep(target: CheckoutStep) {
    setError(null);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleContactNext() {
    if (!isContactComplete) {
      setError(
        address.email.trim() && !isEmailAddress(address.email)
          ? t("emailInvalid")
          : t("fillRequired")
      );
      return;
    }
    setShippingReached(true);
    goToStep(CheckoutStep.Shipping);
  }

  async function handleShippingNext() {
    if (!isContactComplete) {
      goToStep(CheckoutStep.Contact);
      return;
    }
    if (!isShippingComplete) {
      setError(usingLocker && !locker ? t("lockerRequired") : t("fillRequired"));
      return;
    }
    if (placement && !dirty) {
      goToStep(CheckoutStep.Payment);
      return;
    }

    setLoading(true);
    setError(null);

    const delivery = {
      billing: getBillingAddress(address, chosenLocker),
      note: address.note,
      deliveryMethod,
      locker: chosenLocker,
    };
    checkoutId.current ??= crypto.randomUUID();

    const result = placement
      ? await sendCheckoutOrder("PATCH", {
          ...delivery,
          orderId: placement.checkout.orderId,
          key: placement.checkout.key,
        })
      : await sendCheckoutOrder("POST", {
          ...delivery,
          items: getOrderItems(items),
          locale,
          currency,
          checkoutId: checkoutId.current,
        });

    setLoading(false);

    if (isPlacedCheckout(result)) {
      onPlaced(result, details);
      goToStep(CheckoutStep.Payment);
      return;
    }
    if (result.error === CheckoutError.Unavailable && result.unavailable?.length) {
      onSoldOut(result.unavailable);
      return;
    }
    setError(t(getCheckoutErrorKey(result.error)));
  }

  // Główny przycisk kroku to submit, więc Enter w polu też przechodzi dalej.
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === CheckoutStep.Contact) handleContactNext();
    else void handleShippingNext();
  }

  const stepLabels = [
    t("stepContact"),
    t("stepShipping"),
    t("stepPayment"),
    t("stepSummary"),
  ];

  const onShipping = step === CheckoutStep.Shipping;
  const placesOrder = onShipping && (!placement || dirty);
  const primaryLabel = !onShipping
    ? t("continue")
    : !placement
      ? t("placeOrder")
      : dirty
        ? t("saveChanges")
        : t("continue");
  const hint = !onShipping
    ? undefined
    : !placement
      ? t("placeOrderHint", { count: pieces })
      : dirty
        ? t("saveChangesHint", { number: placement.checkout.number })
        : undefined;

  const showTotals = shippingReached || placement !== null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div>
        <CheckoutStepper
          steps={stepLabels}
          current={step}
          reachable={reachable}
          onSelect={(index) => goToStep(index as CheckoutStep)}
        />

        {/* Kroki 1 i 2 są ukrywane, nie odmontowywane — mapa paczkomatów
            zachowuje wtedy swój stan przy chodzeniu tam i z powrotem. */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className={cn(step === CheckoutStep.Payment && "hidden")}
        >
          <div className={cn(step !== CheckoutStep.Contact && "hidden")}>
            <p className={STEP_HEADING_CLASS}>{t("contactDetails")}</p>
            <ContactFields address={address} onFieldChange={onFieldChange} />
          </div>

          <div className={cn(!onShipping && "hidden")}>
            <p className={STEP_HEADING_CLASS}>{t("shippingAddress")}</p>
            <ShippingFields
              address={address}
              onFieldChange={onFieldChange}
              currency={currency}
              hasLocker={hasLocker}
              deliveryMethod={deliveryMethod}
              onDeliveryMethodChange={onDeliveryMethodChange}
              locker={locker}
              onLockerSelect={onLockerSelect}
              saved={saved}
              canSave={canSave}
              onSavedChange={onSavedChange}
            />
          </div>

          <CheckoutActions
            onBack={onShipping ? () => goToStep(CheckoutStep.Contact) : onLeave}
            primaryLabel={primaryLabel}
            accent={placesOrder}
            loading={loading}
            error={error}
            hint={hint}
          />
        </form>

        {placement && (
          <div className={cn(step !== CheckoutStep.Payment && "hidden")}>
            <PaymentStep
              checkout={placement.checkout}
              address={address}
              locker={chosenLocker}
              deliveryLabel={deliveryLabel}
              total={grandTotal}
              currency={currency}
              onBack={() => goToStep(CheckoutStep.Shipping)}
              onEditContact={() => goToStep(CheckoutStep.Contact)}
              onEditShipping={() => goToStep(CheckoutStep.Shipping)}
            />
          </div>
        )}
      </div>

      <OrderSummary
        items={items}
        currency={currency}
        shippingCost={showTotals ? shippingCost : null}
        grandTotal={showTotals ? grandTotal : null}
        deliveryLabel={deliveryLabel}
      />
    </div>
  );
}
