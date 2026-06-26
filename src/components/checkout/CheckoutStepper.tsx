"use client";

import { cn } from "@/lib/utils";

type Props = {
  // Ordered step labels shown next to each circle.
  steps: string[];
  // Zero-based index of the step the customer is currently on.
  current: number;
  // Navigate to an already-completed step. Future steps are not clickable so
  // the customer can only move forward through the validated next buttons.
  onSelect: (index: number) => void;
};

export default function CheckoutStepper({ steps, current, onSelect }: Props) {
  return (
    <nav aria-label="Checkout progress" className="mb-12">
      <ol className="flex items-center">
        {steps.map((label, index) => {
          const isActive = index === current;
          const isDone = index < current;
          const isReachable = index <= current;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex items-center gap-2.5",
                  isReachable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors",
                    isActive || isDone
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-[10px] tracking-widest uppercase transition-colors sm:inline",
                    isActive
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted)]"
                  )}
                >
                  {label}
                </span>
              </button>

              {!isLast && (
                <span
                  className={cn(
                    "mx-3 h-px flex-1 transition-colors",
                    isDone ? "bg-[var(--foreground)]" : "bg-[var(--border)]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
