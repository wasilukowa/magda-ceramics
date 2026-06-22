"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/server-actions/account";
import { AccountFormState, Customer } from "@/contracts/server/auth";

const initialState: AccountFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error,#b00020)]";

export default function ProfileForm({ customer }: { customer: Customer }) {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState(
    updateProfile,
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
            defaultValue={customer.firstName}
            aria-invalid={Boolean(state.errors?.firstName)}
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
            defaultValue={customer.lastName}
            aria-invalid={Boolean(state.errors?.lastName)}
            className={inputClass}
          />
          {state.errors?.lastName && (
            <p className={errorClass}>{state.errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>
          {t("fields.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={customer.email}
          aria-invalid={Boolean(state.errors?.email)}
          className={inputClass}
        />
        {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
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
