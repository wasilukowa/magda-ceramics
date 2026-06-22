"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { register } from "@/server-actions/auth";
import { RegisterFormState } from "@/contracts/server/auth";

const initialState: RegisterFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error,#b00020)]";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(register, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/account");
      router.refresh();
    }
  }, [state.status, router]);

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
            defaultValue={state.values?.firstName}
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
            autoComplete="family-name"
            defaultValue={state.values?.lastName}
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
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.errors?.email)}
          className={inputClass}
        />
        {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          {t("fields.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.password)}
          className={inputClass}
        />
        {state.errors?.password ? (
          <p className={errorClass}>{state.errors.password}</p>
        ) : (
          <p className="text-xs text-[var(--muted)]">{t("register.passwordHint")}</p>
        )}
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
        {pending ? t("register.submitting") : t("register.submit")}
      </button>

      <p className="text-sm text-[var(--muted)] text-center">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="underline hover:opacity-60">
          {t("register.loginLink")}
        </Link>
      </p>
    </form>
  );
}
