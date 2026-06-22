"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { changePassword } from "@/server-actions/account";
import { AccountFormState } from "@/contracts/server/auth";

const initialState: AccountFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error,#b00020)]";

export default function PasswordForm() {
  const t = useTranslations("account");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-6"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="current" className={labelClass}>
          {t("fields.currentPassword")}
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.errors?.current)}
          className={inputClass}
        />
        {state.errors?.current && (
          <p className={errorClass}>{state.errors.current}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="next" className={labelClass}>
          {t("fields.newPassword")}
        </label>
        <input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.next)}
          className={inputClass}
        />
        {state.errors?.next && <p className={errorClass}>{state.errors.next}</p>}
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
        {pending ? t("saving") : t("password.submit")}
      </button>
    </form>
  );
}
