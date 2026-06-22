"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateAddress } from "@/server-actions/account";
import { AccountFormState, CustomerAddress } from "@/contracts/server/auth";
import { CHECKOUT_COUNTRIES } from "@/content/data";

const initialState: AccountFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors w-full";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error,#b00020)]";

export default function AddressForm({ billing }: { billing: CustomerAddress }) {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState(
    updateAddress,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="firstName" className={labelClass}>
            {t("fields.firstName")}
          </label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={billing.firstName}
            className={inputClass}
          />
          {state.errors?.firstName && (
            <p className={errorClass}>{state.errors.firstName}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="lastName" className={labelClass}>
            {t("fields.lastName")}
          </label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={billing.lastName}
            className={inputClass}
          />
          {state.errors?.lastName && (
            <p className={errorClass}>{state.errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className={labelClass}>
          {t("fields.phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={billing.phone}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="country" className={labelClass}>
          {t("fields.country")}
        </label>
        <select
          id="country"
          name="country"
          defaultValue={billing.country || "PL"}
          className={inputClass}
        >
          {CHECKOUT_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        {state.errors?.country && (
          <p className={errorClass}>{state.errors.country}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="street" className={labelClass}>
          {t("fields.street")}
        </label>
        <input
          id="street"
          name="street"
          autoComplete="street-address"
          defaultValue={billing.street}
          className={inputClass}
        />
        {state.errors?.street && (
          <p className={errorClass}>{state.errors.street}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="postcode" className={labelClass}>
            {t("fields.postcode")}
          </label>
          <input
            id="postcode"
            name="postcode"
            autoComplete="postal-code"
            defaultValue={billing.postcode}
            className={inputClass}
          />
          {state.errors?.postcode && (
            <p className={errorClass}>{state.errors.postcode}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="city" className={labelClass}>
            {t("fields.city")}
          </label>
          <input
            id="city"
            name="city"
            autoComplete="address-level2"
            defaultValue={billing.city}
            className={inputClass}
          />
          {state.errors?.city && <p className={errorClass}>{state.errors.city}</p>}
        </div>
      </div>

      {state.status === "success" && (
        <p aria-live="polite" className="text-xs text-[var(--color-success,#2e7d32)]">
          {state.message}
        </p>
      )}
      {state.status === "error" && !state.errors && (
        <p aria-live="polite" className={errorClass}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors self-start disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--foreground)]"
      >
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
