"use client";

import "./globals.css";

// Last line of defence: this replaces the whole document when even the root
// layout fails, so it has to bring its own <html>/<body> and cannot use the
// translation provider — hence both languages side by side.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted)]">
            Magda Ceramics
          </p>
          <h1 className="text-2xl font-light tracking-wide">
            Coś poszło nie tak · Something went wrong
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md">
            Spróbuj odświeżyć stronę za chwilę. · Please try reloading the page in
            a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-xs tracking-widest uppercase border border-current px-8 py-3 hover:opacity-60 transition-opacity"
          >
            Odśwież · Reload
          </button>
        </div>
      </body>
    </html>
  );
}
