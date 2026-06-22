"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import LogoutButton from "./LogoutButton";

const LINKS = [
  { href: "/account", key: "overview" },
  { href: "/account/orders", key: "orders" },
  { href: "/account/details", key: "details" },
  { href: "/wishlist", key: "wishlist" },
] as const;

export default function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {LINKS.map((link) => {
        const active =
          link.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-4 py-3 tracking-widest uppercase text-xs transition-colors hover:bg-[var(--color-navbar-hover)]",
              active && "bg-[var(--color-navbar-hover)] font-medium",
            )}
          >
            {t(`nav.${link.key}`)}
          </Link>
        );
      })}
      <div className="px-4 py-3 border-t border-[var(--border)] mt-2">
        <LogoutButton />
      </div>
    </nav>
  );
}
