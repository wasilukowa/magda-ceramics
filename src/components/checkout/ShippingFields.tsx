"use client";

import { useLocale, useTranslations } from "next-intl";
import { Address } from "@/contracts/server/cart";
import { Currency } from "@/contracts/shared";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { CHECKOUT_COUNTRIES } from "@/content/data";
import { getCountryLabel, getShippingCost } from "@/lib/helpers/shipping";
import { formatPrice } from "@/lib/helpers/currency";
import { cn } from "@/lib/utils";
import { isPhoneNumber } from "@/utility";
import ParcelLockerField from "./ParcelLockerField";
import CheckoutField, { CHECKOUT_INPUT_CLASS } from "./CheckoutField";

type Props = {
  address: Address;
  onFieldChange: (field: keyof Address, value: string) => void;
  // Waluta kasy — po złożeniu zamówienia ta, w której je złożono.
  currency: Currency;
  hasLocker: boolean;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  locker: InPostPoint | null;
  onLockerSelect: (point: InPostPoint) => void;
};

// Krok 2 kasy: dokąd i jak. Telefon jest tutaj (decyzja Natalii 2026-10-12),
// bo do paczkomatu jest obowiązkowy — InPost wysyła na niego kod odbioru.
// Uwagi też, bo trafiają do zamówienia, które ten krok składa.
export default function ShippingFields({
  address,
  onFieldChange,
  currency,
  hasLocker,
  deliveryMethod,
  onDeliveryMethodChange,
  locker,
  onLockerSelect,
}: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();

  const usingLocker = hasLocker && deliveryMethod === DeliveryMethod.Locker;

  const set =
    (field: keyof Address) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onFieldChange(field, e.target.value);

  return (
    <div className="space-y-4">
      <CheckoutField label={t("country")}>
        <select value={address.country} onChange={set("country")} className={CHECKOUT_INPUT_CLASS}>
          {CHECKOUT_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {getCountryLabel(c.code, locale)}
            </option>
          ))}
        </select>
      </CheckoutField>

      {hasLocker && (
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
                  : "border-[var(--color-control-border)] hover:border-[var(--foreground)]"
              )}
            >
              {method === DeliveryMethod.Locker ? t("methodLocker") : t("methodCourier")}
              {/* Za granicą paczkomat i kurier mają różne ceny, więc
                  cena stoi przy wyborze, a nie tylko w podsumowaniu. */}
              <span className="block mt-1 text-xs tracking-normal normal-case">
                {formatPrice(getShippingCost(address.country, currency, method), currency)}
              </span>
            </button>
          ))}
        </div>
      )}

      {usingLocker ? (
        <ParcelLockerField country={address.country} locker={locker} onSelect={onLockerSelect} />
      ) : (
        <>
          <CheckoutField label={t("street")}>
            <input
              value={address.street}
              onChange={set("street")}
              className={CHECKOUT_INPUT_CLASS}
              autoComplete="address-line1"
            />
          </CheckoutField>
          <CheckoutField label={t("street2")}>
            <input
              value={address.street2}
              onChange={set("street2")}
              className={CHECKOUT_INPUT_CLASS}
              autoComplete="address-line2"
            />
          </CheckoutField>
          <div className="grid grid-cols-2 gap-4">
            <CheckoutField label={t("postcode")}>
              <input
                value={address.postcode}
                onChange={set("postcode")}
                className={CHECKOUT_INPUT_CLASS}
                autoComplete="postal-code"
              />
            </CheckoutField>
            <CheckoutField label={t("city")}>
              <input
                value={address.city}
                onChange={set("city")}
                className={CHECKOUT_INPUT_CLASS}
                autoComplete="address-level2"
              />
            </CheckoutField>
          </div>
        </>
      )}

      <CheckoutField label={t(usingLocker ? "phoneRequired" : "phone")}>
        <input
          type="tel"
          value={address.phone}
          onChange={set("phone")}
          className={CHECKOUT_INPUT_CLASS}
          autoComplete="tel"
        />
      </CheckoutField>
      {usingLocker &&
        (address.phone && !isPhoneNumber(address.phone) ? (
          <p className="-mt-2 text-xs text-[var(--color-error)]">{t("phoneInvalid")}</p>
        ) : (
          <p className="-mt-2 text-xs text-[var(--muted)]">{t("phoneLockerHint")}</p>
        ))}

      <CheckoutField label={t("note")}>
        <textarea
          value={address.note}
          onChange={set("note")}
          rows={3}
          className={cn(CHECKOUT_INPUT_CLASS, "resize-none")}
        />
      </CheckoutField>
    </div>
  );
}
