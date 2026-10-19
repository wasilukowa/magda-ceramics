"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { saveAddress } from "@/server-actions/addresses";
import { AccountFormState, SavedAddressInput } from "@/contracts/server/auth";
import { CHECKOUT_COUNTRIES } from "@/content/data";
import { getCountryLabel } from "@/lib/helpers/shipping";
import { ButtonArrow, buttonClass } from "@/components/ui/button";
import { ButtonVariant } from "@/contracts/shared";

const initialState: AccountFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--color-control-border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors w-full";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error)]";

type Props = {
  // Numer poprawianego adresu; bez niego formularz dodaje nowy.
  id?: string;
  initial: SavedAddressInput;
  // Po zapisaniu (z komunikatem) albo po „Anuluj" (bez).
  onDone: (message?: string) => void;
};

// Pola jednego zapisanego adresu — „Edytuj" przy adresie albo „Dodaj adres"
// w zakładce „Adresy".
export default function AddressForm({ id, initial, onDone }: Props) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    async (prevState: AccountFormState, formData: FormData) => {
      const result = await saveAddress(prevState, formData);
      if (result.status === "success") onDone(result.message);
      return result;
    },
    initialState,
  );

  const field = (
    name: keyof SavedAddressInput,
    autoComplete: string,
    type = "text",
  ) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={`address-${name}`} className={labelClass}>
        {t(`fields.${name}`)}
      </label>
      <input
        id={`address-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={initial[name]}
        aria-invalid={Boolean(state.errors?.[name])}
        className={inputClass}
      />
      {state.errors?.[name] && <p className={errorClass}>{state.errors[name]}</p>}
    </div>
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 border border-[var(--color-control-border)] p-5"
      noValidate
    >
      <input type="hidden" name="id" value={id ?? ""} />

      <div className="grid grid-cols-2 gap-4">
        {field("firstName", "given-name")}
        {field("lastName", "family-name")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="address-country" className={labelClass}>
          {t("fields.country")}
        </label>
        <select
          id="address-country"
          name="country"
          defaultValue={initial.country || "PL"}
          className={inputClass}
        >
          {CHECKOUT_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {getCountryLabel(c.code, locale)}
            </option>
          ))}
        </select>
        {state.errors?.country && <p className={errorClass}>{state.errors.country}</p>}
      </div>

      {field("street", "address-line1")}
      {field("street2", "address-line2")}

      <div className="grid grid-cols-2 gap-4">
        {field("postcode", "postal-code")}
        {field("city", "address-level2")}
      </div>

      {field("phone", "tel", "tel")}

      {state.status === "error" && !state.errors && (
        <p aria-live="polite" className={errorClass}>
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={buttonClass()}>
          {pending ? (
            t("saving")
          ) : (
            <>
              {t("save")}
              <ButtonArrow />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onDone()}
          disabled={pending}
          className={buttonClass({ variant: ButtonVariant.Secondary })}
        >
          {t("addresses.cancel")}
        </button>
      </div>
    </form>
  );
}
