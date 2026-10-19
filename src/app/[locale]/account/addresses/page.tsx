import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentCustomer } from "@/lib/auth/dal";
import AccountSection from "@/components/account/AccountSection";
import AddressBook from "@/components/account/AddressBook";
import LockerBook from "@/components/account/LockerBook";
import AccountLoading from "@/components/account/AccountLoading";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("nav.addresses")} — Magda Ceramics` };
}

async function SavedDelivery() {
  const t = await getTranslations("account");
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <>
      <AccountSection title={t("addresses.deliveryTitle")}>
        <AddressBook
          addresses={customer.addresses}
          firstName={customer.firstName}
          lastName={customer.lastName}
        />
      </AccountSection>
      <AccountSection title={t("addresses.lockersTitle")}>
        <LockerBook lockers={customer.lockers} />
      </AccountSection>
    </>
  );
}

// Zapisane adresy dostawy i paczkomaty (decyzja Natalii 2026-10-19). Kasa
// wpisuje je zalogowanemu klientowi sama. Dane klienta we własnej granicy
// <Suspense> — patrz strona zamówień.
export default async function AddressesPage() {
  const t = await getTranslations("account");

  return (
    <div className="flex flex-col gap-14">
      <p className="text-sm text-[var(--muted)] leading-relaxed">{t("addresses.intro")}</p>
      <Suspense fallback={<AccountLoading />}>
        <SavedDelivery />
      </Suspense>
    </div>
  );
}
