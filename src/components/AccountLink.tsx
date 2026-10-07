"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/store/providers/AuthProvider";

// Jedyny kawałek nagłówka, który zależy od sesji: zalogowany idzie na konto,
// gość na logowanie. Sesja przychodzi obietnicą (patrz AuthProvider), więc ten
// link dostaje własną granicę <Suspense> — reszta paska nie musi na nią czekać
// i wchodzi do statycznej skorupy strony.
//
// Widok zapasowy to wersja dla niezalogowanego — taki jest los większości
// wchodzących, a etykieta, adres i wygląd ikony poprawiają się, gdy tylko
// sesja jest znana.

// Zalogowany widzi ludzika WYPEŁNIONEGO, gość sam kontur. Dotąd obie wersje
// wyglądały identycznie i po pasku nie dało się poznać, czy jest się w środku.
const AccountIcon = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={isLoggedIn ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    // Bez tego wypełnienie zlewa głowę z ramionami w jedną plamę: obrys
    // rysuje się wtedy w środku figury, a nie na jej brzegu.
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

// Logowanie zaczęte w kasie wraca do kasy (prośba Natalii 2026-10-07) — tak
// samo jak przycisk „Zaloguj się" w samej kasie. Z każdej innej strony
// logowanie prowadzi na konto, jak dotąd.
const useLoginHref = () =>
  usePathname() === "/checkout"
    ? { pathname: "/login" as const, query: { redirect: "/checkout" } }
    : ("/login" as const);

function IconLink({
  className,
  isLoggedIn,
}: {
  className?: string;
  isLoggedIn: boolean;
}) {
  const t = useTranslations();
  const loginHref = useLoginHref();

  return (
    <Link
      href={isLoggedIn ? "/account" : loginHref}
      aria-label={isLoggedIn ? t("nav.account") : t("nav.login")}
      className={className}
    >
      <AccountIcon isLoggedIn={isLoggedIn} />
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
  const loginHref = useLoginHref();

  return (
    <Link href={isLoggedIn ? "/account" : loginHref} onClick={onNavigate}>
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
