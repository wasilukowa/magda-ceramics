"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/store/providers/AuthProvider";

// Jedyny kawałek nagłówka, który zależy od sesji: zalogowany idzie na konto,
// gość na logowanie. Sesja przychodzi obietnicą (patrz AuthProvider), więc ten
// link dostaje własną granicę <Suspense> — reszta paska nie musi na nią czekać
// i wchodzi do statycznej skorupy strony.
//
// Widok zapasowy to wersja dla niezalogowanego. Taki jest los większości
// wchodzących, ikona w obu wypadkach wygląda identycznie, a etykieta i adres
// poprawiają się, gdy tylko sesja jest znana.

const AccountIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

function IconLink({
  className,
  isLoggedIn,
}: {
  className?: string;
  isLoggedIn: boolean;
}) {
  const t = useTranslations();

  return (
    <Link
      href={isLoggedIn ? "/account" : "/login"}
      aria-label={isLoggedIn ? t("nav.account") : t("nav.login")}
      className={className}
    >
      <AccountIcon />
    </Link>
  );
}

function ResolvedIconLink({ className }: { className?: string }) {
  return <IconLink className={className} isLoggedIn={Boolean(useAuth())} />;
}

export function AccountIconLink({ className }: { className?: string }) {
  return (
    <Suspense fallback={<IconLink className={className} isLoggedIn={false} />}>
      <ResolvedIconLink className={className} />
    </Suspense>
  );
}

function MenuLink({
  isLoggedIn,
  onNavigate,
}: {
  isLoggedIn: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations();

  return (
    <Link href={isLoggedIn ? "/account" : "/login"} onClick={onNavigate}>
      {isLoggedIn ? t("nav.account") : t("nav.login")}
    </Link>
  );
}

function ResolvedMenuLink({ onNavigate }: { onNavigate?: () => void }) {
  return <MenuLink isLoggedIn={Boolean(useAuth())} onNavigate={onNavigate} />;
}

export function AccountMenuLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<MenuLink isLoggedIn={false} onNavigate={onNavigate} />}>
      <ResolvedMenuLink onNavigate={onNavigate} />
    </Suspense>
  );
}
