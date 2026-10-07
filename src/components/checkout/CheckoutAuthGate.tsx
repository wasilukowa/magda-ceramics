"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ButtonArrow, buttonClass } from "@/components/ui/button";
import { ButtonSize } from "@/contracts/shared";

type Props = {
  // Proceed through checkout without an account.
  onGuestContinue: () => void;
};

export default function CheckoutAuthGate({ onGuestContinue }: Props) {
  const t = useTranslations("checkout");

  return (
    <div className="space-y-4">
      <div className="border border-[var(--border)] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm mb-1">{t("haveAccount")}</p>
          <p className="text-xs text-[var(--muted)]">{t("haveAccountHint")}</p>
        </div>
        <Link
          href={{ pathname: "/login", query: { redirect: "/checkout" } }}
          className={buttonClass({ className: "shrink-0" })}
        >
          {t("signIn")}
          <ButtonArrow />
        </Link>
      </div>

      <div className="border border-[var(--border)] p-6">
        <p className="text-sm mb-1">{t("guestCheckout")}</p>
        <p className="text-xs text-[var(--muted)] mb-5">{t("guestHint")}</p>
        <button
          type="button"
          onClick={onGuestContinue}
          className={buttonClass({ size: ButtonSize.Block })}
        >
          {t("continueAsGuest")}
          <ButtonArrow />
        </button>
      </div>
    </div>
  );
}
