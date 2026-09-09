"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/hooks/useWishlist";
import { WishlistNoticeKind } from "@/contracts/store";

// Ile sekund wisi informacja o nieudanym zapisie. Podpowiedź o koncie NIE znika
// sama — jest w niej odnośnik do kliknięcia, a komunikat, który ucieka spod
// palca, byłby wredny.
const SAVE_FAILED_MS = 6000;

// Odzywa się po kliknięciu serca: raz, żeby powiedzieć gościowi, że bez konta
// lista zostaje w tej jednej przeglądarce, albo gdy zapis na koncie nie doszedł
// do skutku. Siedzi w layoucie, bo serca są w trzech różnych miejscach sklepu,
// a komunikat ma być jeden.
export default function WishlistNotice() {
  const { notice, dismissNotice } = useWishlist();
  const t = useTranslations("wishlist.notice");

  useEffect(() => {
    if (notice !== WishlistNoticeKind.SaveFailed) return;
    const timer = setTimeout(dismissNotice, SAVE_FAILED_MS);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;

  const isGuestHint = notice === WishlistNoticeKind.GuestFirstLike;

  return (
    // `role="status"` zamiast `alert`: czytnik ekranu przeczyta to, kiedy
    // skończy bieżące zdanie, zamiast przerywać klientowi w pół słowa.
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-[55] mx-auto max-w-sm border border-[var(--border)] bg-[var(--background)] p-5 shadow-lg sm:inset-x-auto sm:right-6"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs tracking-widest uppercase">
          {isGuestHint ? t("guestTitle") : t("failedTitle")}
        </p>
        <button
          type="button"
          onClick={dismissNotice}
          aria-label={t("close")}
          className="-mt-1 shrink-0 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        {isGuestHint ? t("guestBody") : t("failedBody")}
      </p>

      {isGuestHint && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href={{ pathname: "/login", query: { redirect: "/wishlist" } }}
            onClick={dismissNotice}
            className="bg-[var(--foreground)] py-3 text-center text-xs uppercase tracking-widest text-[var(--background)] transition-opacity hover:opacity-80"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/register"
            onClick={dismissNotice}
            className="border border-[var(--color-control-border)] py-3 text-center text-xs uppercase tracking-widest transition-colors hover:border-[var(--foreground)]"
          >
            {t("register")}
          </Link>
        </div>
      )}
    </div>
  );
}
