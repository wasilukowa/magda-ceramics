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
        // The knob sits in the flow of a flex row with 2px of padding, so its
        // resting place is the left edge of the track and the only thing to
        // compute is the travel: 44px track − 2×2px padding − 20px knob = 20px.
        // Absolute positioning here is what let the knob wander off the track.
        className={`relative mt-1 flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors ${
          checked ? "bg-[var(--color-accent)]" : "bg-[var(--border)]"
        } ${locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        <span
          // Ring and shadow keep the white knob readable against both track
          // colours — including the dimmed "always on" switch.
          className={`h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
