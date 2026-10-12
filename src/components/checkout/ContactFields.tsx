"use client";

import { useTranslations } from "next-intl";
import { Address } from "@/contracts/server/cart";
import CheckoutField, { CHECKOUT_INPUT_CLASS } from "./CheckoutField";

type Props = {
  address: Address;
  onFieldChange: (field: keyof Address, value: string) => void;
};

// Krok 1 kasy: kto zamawia. Telefon jest w kroku „Wysyłka", bo tam decyduje
// się, czy jest obowiązkowy (paczkomat).
export default function ContactFields({ address, onFieldChange }: Props) {
  const t = useTranslations("checkout");

  const set =
    (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
      onFieldChange(field, e.target.value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CheckoutField label={t("firstName")}>
          <input
            value={address.firstName}
            onChange={set("firstName")}
            className={CHECKOUT_INPUT_CLASS}
            autoComplete="given-name"
          />
        </CheckoutField>
        <CheckoutField label={t("lastName")}>
          <input
            value={address.lastName}
            onChange={set("lastName")}
            className={CHECKOUT_INPUT_CLASS}
            autoComplete="family-name"
          />
        </CheckoutField>
      </div>
      <CheckoutField label={t("emailLabel")}>
        <input
          type="email"
          value={address.email}
          onChange={set("email")}
          className={CHECKOUT_INPUT_CLASS}
          autoComplete="email"
        />
      </CheckoutField>
    </div>
  );
}
