"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resetPassword } from "@/server-actions/auth";
import { ResetPasswordFormState } from "@/contracts/server/auth";

const initialState: ResetPasswordFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--color-control-border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors";
const labelClass = "text-xs tracking-widest uppercase text-[var(--muted)]";
const errorClass = "text-xs text-[var(--color-error)]";

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  // Hasło zmienione. NIE logujemy od razu — po takiej zmianie lepiej, żeby
  // klient raz wpisał nowe hasło i sam sprawdził, że działa.
  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="text-sm leading-relaxed">{state.message}</p>
        <p>
          <Link
            href="/login"
            className="inline-block text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            {t("login.submit")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          {t("reset.newPassword")}
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

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className={labelClass}>
          {t("reset.confirmPassword")}
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.confirm)}
          className={inputClass}
        />
        {state.errors?.confirm && (
          <p className={errorClass}>{state.errors.confirm}</p>
        )}
      </div>

      {state.status === "error" && !state.errors && (
        <p aria-live="polite" className={errorClass}>
          {state.message}{" "}
          <Link href="/forgot-password" className="underline hover:opacity-60">
            {t("reset.requestAgain")}
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--foreground)]"
      >
        {pending ? t("reset.submitting") : t("reset.submit")}
      </button>
    </form>
  );
}
