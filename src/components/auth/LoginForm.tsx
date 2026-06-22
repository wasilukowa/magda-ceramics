"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { login } from "@/server-actions/auth";
import { LoginFormState } from "@/contracts/server/auth";

const initialState: LoginFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error,#b00020)]";

export default function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(login, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/account");
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
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
          autoComplete="current-password"
          aria-invalid={Boolean(state.errors?.password)}
          className={inputClass}
        />
        {state.errors?.password && (
          <p className={errorClass}>{state.errors.password}</p>
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
        {pending ? t("login.submitting") : t("login.submit")}
      </button>

      <p className="text-sm text-[var(--muted)] text-center">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="underline hover:opacity-60">
          {t("login.registerLink")}
        </Link>
      </p>
    </form>
  );
}
