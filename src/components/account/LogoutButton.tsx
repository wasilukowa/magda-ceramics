"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { logout } from "@/server-actions/auth";

export default function LogoutButton({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("account");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.replace("/");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={
        className ??
        "text-xs tracking-widest uppercase hover:opacity-60 transition-opacity disabled:opacity-50"
      }
    >
      {pending ? t("nav.loggingOut") : t("nav.logout")}
    </button>
  );
}
