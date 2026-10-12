"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/lib/store/providers/AuthProvider";
import CheckoutContent from "./CheckoutContent";
import CheckoutAuthGate from "@/components/checkout/CheckoutAuthGate";
import CheckoutUnavailable from "@/components/checkout/CheckoutUnavailable";
import OrderSummary from "@/components/checkout/OrderSummary";
import { Link, useRouter } from "@/i18n/navigation";
import { Address } from "@/contracts/server/cart";
import {
  CheckoutPlacement,
  PlacedCheckout,
  UnavailableItem,
} from "@/contracts/server/checkout";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { getShippingCost, hasInPostLocker } from "@/lib/helpers/shipping";
import { getCartTotal } from "@/lib/helpers/currency";
import {
  parsePlacedOrder,
  readPlacedOrderRaw,
  rememberPlacedOrder,
} from "@/lib/helpers/checkout";

const EMPTY_ADDRESS: Address = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  street2: "",
  city: "",
  postcode: "",
  country: "PL",
  note: "",
};

// Pamięć karty nie wysyła zdarzeń o zmianach w tej samej karcie — czytamy ją
// raz, przy rysowaniu. Serwer jej nie ma.
const subscribeNever = () => () => {};
const getNoPlacedOrder = () => null;

function Checkout() {
  const { items, itemCount, removeItem, clearCart } = useCart();
  const { currency } = useCurrency();
  const user = useAuth();
  const router = useRouter();
  const t = useTranslations("checkout");
  // Guests must first choose between signing in and continuing without an
  // account; logged-in customers skip the gate entirely.
  const [guestChosen, setGuestChosen] = useState(false);
  const showGate = !user && !guestChosen;
  // Adres i dostawa mieszkają tutaj, nie w CheckoutContent, żeby przetrwały
  // ekran „Ktoś był szybszy", który na chwilę zastępuje formularz.
  // Pre-fill the e-mail for logged-in customers.
  const [address, setAddress] = useState<Address>(() => ({
    ...EMPTY_ADDRESS,
    email: user?.email ?? "",
  }));
  // Parcel-locker delivery is offered for Poland and the InPost International
  // countries.
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    DeliveryMethod.Locker
  );
  const [locker, setLocker] = useState<InPostPoint | null>(null);
  // Prace, które zdążyły się sprzedać — wykryte przy składaniu zamówienia.
  // Dopóki lista nie jest pusta, kasa pokazuje je zamiast formularza.
  const [soldOut, setSoldOut] = useState<UnavailableItem[]>([]);
  // Zamówienie złożone w tej wizycie — patrz CheckoutPlacement.
  const [placement, setPlacement] = useState<CheckoutPlacement | null>(null);
  const lastOrder = parsePlacedOrder(
    useSyncExternalStore(subscribeNever, readPlacedOrderRaw, getNoPlacedOrder)
  );

  // Po złożeniu zamówienia liczy się to, co w nim jest — koszyk jest już pusty.
  const orderItems = placement?.items ?? items;
  const orderCurrency = placement?.currency ?? currency;
  const country = address.country;
  const hasLocker = hasInPostLocker(country);
  const effectiveMethod = hasLocker ? deliveryMethod : DeliveryMethod.Courier;
  const usingLocker = hasLocker && effectiveMethod === DeliveryMethod.Locker;
  const shippingCost = getShippingCost(country, orderCurrency, effectiveMethod);
  const grandTotal = getCartTotal(orderItems, orderCurrency) + shippingCost;
  const deliveryLabel = usingLocker
    ? t("summaryDeliveryLocker")
    : t("summaryDeliveryCourier");

  function setField(field: keyof Address, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // A locker is tied to one country, so drop the selection on any country
    // change — whether moving to a courier-only country or another locker
    // country (the previous locker is invalid there).
    if (field === "country") setLocker(null);
  }

  // Pierwsze złożenie: prace z koszyka przechodzą do zamówienia (zarezerwowane
  // dla tego klienta), więc koszyk się czyści. Poprawka podmienia tylko
  // płatność i odcisk zapisanych danych.
  function handlePlaced(checkout: PlacedCheckout, details: string) {
    if (placement) {
      setPlacement({ ...placement, checkout, details });
      return;
    }
    setPlacement({ checkout, items, currency, details });
    rememberPlacedOrder({ id: checkout.orderId, key: checkout.key, number: checkout.number });
    clearCart();
  }

  // „Wstecz" z pierwszego kroku: gość wraca do wyboru gość / logowanie,
  // zalogowany tam, skąd przyszedł.
  function leaveCheckout() {
    if (!user) {
      setGuestChosen(false);
      return;
    }
    if (window.history.length > 1) router.back();
    else router.push("/shop");
  }

  // Wyrzucenie sprzedanych prac zmienia koszyk, a z nim podsumowanie — tu
  // zostaje tylko sprzątnięcie komunikatu.
  function removeSoldOut() {
    soldOut.forEach((item) => removeItem(item.id));
    setSoldOut([]);
  }

  if (itemCount === 0 && !placement) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-6">
        <p className="text-sm text-[var(--muted)]">{t("empty")}</p>
        {lastOrder && (
          <p className="text-sm">
            {t("lastOrder", { number: lastOrder.number })}{" "}
            <Link
              href={{ pathname: "/order", query: { id: lastOrder.id, key: lastOrder.key } }}
              className="underline underline-offset-4 hover:text-[var(--muted)] transition-colors"
            >
              {t("goToOrder")}
            </Link>
          </p>
        )}
        <Link
          href="/shop"
          className="inline-block text-xs tracking-widest uppercase hover:text-[var(--muted)] transition-colors"
        >
          {t("backToShop")}
        </Link>
      </div>
    );
  }

  const pendingSummary = (
    <OrderSummary
      items={orderItems}
      currency={orderCurrency}
      shippingCost={null}
      grandTotal={null}
      deliveryLabel={deliveryLabel}
    />
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-widest uppercase mb-12">{t("title")}</h1>

      {soldOut.length > 0 || showGate ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            {soldOut.length > 0 ? (
              <CheckoutUnavailable items={soldOut} onRemove={removeSoldOut} />
            ) : (
              <CheckoutAuthGate onGuestContinue={() => setGuestChosen(true)} />
            )}
          </div>
          {pendingSummary}
        </div>
      ) : (
        <CheckoutContent
          items={orderItems}
          currency={orderCurrency}
          address={address}
          onFieldChange={setField}
          hasLocker={hasLocker}
          deliveryMethod={effectiveMethod}
          onDeliveryMethodChange={setDeliveryMethod}
          locker={locker}
          onLockerSelect={setLocker}
          deliveryLabel={deliveryLabel}
          shippingCost={shippingCost}
          grandTotal={grandTotal}
          placement={placement}
          onPlaced={handlePlaced}
          onSoldOut={setSoldOut}
          onLeave={leaveCheckout}
        />
      )}
    </div>
  );
}

// Kasa zna sesję (zalogowany pomija bramkę gość/logowanie), a sesja przychodzi
// obietnicą — stąd granica <Suspense>. Do prerenderu idzie sama rama strony.
export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  );
}
