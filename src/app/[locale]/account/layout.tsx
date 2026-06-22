import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/auth/dal";
import AccountNav from "@/components/account/AccountNav";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect({ href: "/login", locale });

  const t = await getTranslations("account");

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)]">
          {t("title")}
        </h1>
        <p className="text-2xl mt-3 font-light">
          {t("greeting", { name: customer!.firstName || customer!.email })}
        </p>
      </header>

      <div className="grid md:grid-cols-[200px_1fr] gap-10">
        <aside className="md:border-r md:border-[var(--border)] md:pr-4">
          <AccountNav />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
