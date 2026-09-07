"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { requestPasswordReset } from "@/server-actions/auth";
import { ForgotPasswordFormState } from "@/contracts/server/auth";

const initialState: ForgotPasswordFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--color-control-border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error)]";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  // Po wysłaniu maila formularz znika — zostaje samo potwierdzenie. Inaczej
  // kuszące jest kliknięcie „wyślij" jeszcze raz, a każdy klik to kolejny mail.
  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="text-sm leading-relaxed">{state.message}</p>
        <p className="text-sm text-[var(--muted)]">
          <Link href="/login" className="underline hover:opacity-60">
            {t("forgot.backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        {t("forgot.intro")}
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>
          {t("fields.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.errors?.email)}
          className={inputClass}
        />
        {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
      </div>

      {state.status === "error" && !state.errors && (
        <p aria-live="polite" className={errorClass}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--foreground)]"
      >
        {pending ? t("forgot.submitting") : t("forgot.submit")}
      </button>

      <p className="text-sm text-[var(--muted)] text-center">
        <Link href="/login" className="underline hover:opacity-60">
          {t("forgot.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
