import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/auth/dal";
import { customerService } from "@/lib/service/customer";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("title")} — Magda Ceramics` };
}

export default async function AccountOverviewPage() {
  const t = await getTranslations("account");
  const customer = await getCurrentCustomer();

  const orders = customer ? await customerService.getOrders(customer.id) : [];

  const cards = [
    { href: "/account/orders", key: "orders", value: String(orders.length) },
    {
      href: "/account/details",
      key: "details",
      value: customer?.email ?? "",
    },
    {
      href: "/wishlist",
      key: "wishlist",
      value: String(customer?.wishlist.length ?? 0),
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        {t("overview.intro")}
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border border-[var(--border)] p-5 flex flex-col gap-2 hover:bg-[var(--color-navbar-hover)] transition-colors"
          >
            <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
              {t(`nav.${card.key}`)}
            </span>
            <span className="text-lg font-light truncate">{card.value}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
