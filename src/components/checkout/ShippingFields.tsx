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
import { SavedAddress, SavedDelivery } from "@/contracts/server/auth";
import { rememberAddress, rememberLocker } from "@/server-actions/addresses";
import {
  findSavedAddress,
  getAddressFields,
  getAddressLines,
  isSavedLocker,
  toSavedAddressInput,
  toSavedLocker,
} from "@/lib/helpers/savedDelivery";
import ParcelLockerField from "./ParcelLockerField";
import SaveToAccountButton from "./SaveToAccountButton";
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
  // Adresy i paczkomaty z konta — null dla gościa i zanim przyjdą.
  saved: SavedDelivery | null;
  // Zalogowany może dopisać do konta nowy adres albo paczkomat.
  canSave: boolean;
  onSavedChange: (saved: SavedDelivery) => void;
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
  saved,
  canSave,
  onSavedChange,
}: Props) {
  const t = useTranslations("checkout");
  const locale = useLocale();

  const usingLocker = hasLocker && deliveryMethod === DeliveryMethod.Locker;
  const savedAddresses = saved?.addresses ?? [];
  const savedLockers = (saved?.lockers ?? []).filter((candidate) => candidate.country === address.country);
  const addressComplete =
    !!address.street.trim() && !!address.postcode.trim() && !!address.city.trim();
  const chosenAddress = addressComplete ? findSavedAddress(savedAddresses, address) : undefined;

  // Zapisany adres wpisuje się w pola; telefon tylko wtedy, gdy pole jest puste.
  function fillSavedAddress(savedAddress: SavedAddress) {
    Object.entries(getAddressFields(savedAddress)).forEach(([field, value]) =>
      onFieldChange(field as keyof Address, value)
    );
    if (!address.phone && savedAddress.phone) onFieldChange("phone", savedAddress.phone);
  }

  async function saveAddress(): Promise<boolean> {
    const result = await rememberAddress(toSavedAddressInput(address));
    if (result) onSavedChange(result);
    return result !== null;
  }

  async function saveLocker(): Promise<boolean> {
    if (!locker) return false;
    const result = await rememberLocker(toSavedLocker(locker, address.country));
    if (result) onSavedChange(result);
    return result !== null;
  }

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
        <ParcelLockerField
          country={address.country}
          locker={locker}
          onSelect={onLockerSelect}
          savedLockers={savedLockers}
          saveButton={
            locker && (
              <SaveToAccountButton
                key={locker.code}
                label={t("addToMyLockers")}
                isSaved={isSavedLocker(saved?.lockers ?? [], locker.code)}
                canSave={canSave}
                onSave={saveLocker}
              />
            )
          }
        />
      ) : (
        <>
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--muted)]">{t("savedAddresses")}</p>
              {savedAddresses.map((savedAddress) => {
                const selected = chosenAddress?.id === savedAddress.id;
                return (
                  <button
                    key={savedAddress.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => fillSavedAddress(savedAddress)}
                    className={cn(
                      "w-full border px-3 py-3 text-sm text-left transition-colors",
                      selected
                        ? "border-[var(--foreground)]"
                        : "border-[var(--color-control-border)] hover:border-[var(--foreground)]"
                    )}
                  >
                    {getAddressLines(savedAddress, locale).slice(1).join(", ")}
                  </button>
                );
              })}
            </div>
          )}
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
          {addressComplete && (
            <SaveToAccountButton
              key={[address.street, address.street2, address.postcode, address.city, address.country].join("|")}
              label={t("addToMyAddresses")}
              isSaved={chosenAddress !== undefined}
              canSave={canSave}
              onSave={saveAddress}
            />
          )}
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
