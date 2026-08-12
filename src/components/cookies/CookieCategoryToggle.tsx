"use client";

import { CookieCategoryToggleProps } from "@/contracts/shared";

export function CookieCategoryToggle({
  label,
  description,
  checked,
  locked = false,
  lockedNote,
  onChange,
}: CookieCategoryToggleProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b border-[var(--border)] last:border-b-0">
      <div className="flex-1">
        <p className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-2">
          {label}
        </p>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          {description}
        </p>
        {locked && lockedNote && (
          <p className="mt-2 text-[10px] tracking-widest uppercase text-[var(--muted)] opacity-70">
            {lockedNote}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={locked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--color-accent)]" : "bg-[var(--border)]"
        } ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
