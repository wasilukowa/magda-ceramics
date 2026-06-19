"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { sendContactMessage } from "@/server-actions/contact";
import { ContactFormState } from "@/contracts/server/contact";

const initialState: ContactFormState = { status: "idle", message: "" };

const inputClass =
  "border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors";

export default function ContactForm() {
  const t = useTranslations("contact");
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialState,
  );

  if (state.status === "success") {
    return (
      <p
        aria-live="polite"
        className="border border-[var(--border)] px-6 py-8 text-sm text-center text-[var(--foreground)]"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="name"
          className="text-xs tracking-widest uppercase text-[var(--muted)]"
        >
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={state.values?.name}
          aria-invalid={Boolean(state.errors?.name)}
          className={inputClass}
        />
        {state.errors?.name && (
          <p className="text-xs text-[var(--color-error,#b00020)]">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-xs tracking-widest uppercase text-[var(--muted)]"
        >
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.errors?.email)}
          className={inputClass}
        />
        {state.errors?.email && (
          <p className="text-xs text-[var(--color-error,#b00020)]">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="message"
          className="text-xs tracking-widest uppercase text-[var(--muted)]"
        >
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          defaultValue={state.values?.message}
          aria-invalid={Boolean(state.errors?.message)}
          className={`${inputClass} resize-none`}
        />
        {state.errors?.message && (
          <p className="text-xs text-[var(--color-error,#b00020)]">
            {state.errors.message}
          </p>
        )}
      </div>

      {state.status === "error" && !state.errors && (
        <p aria-live="polite" className="text-xs text-[var(--color-error,#b00020)]">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors self-start disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--foreground)]"
      >
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
