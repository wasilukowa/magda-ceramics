import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentCustomer } from "@/lib/auth/dal";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";
import AccountSection from "@/components/account/AccountSection";
import AccountLoading from "@/components/account/AccountLoading";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("nav.details")} — Magda Ceramics` };
}

async function Profile() {
  const customer = await getCurrentCustomer();
  return customer ? <ProfileForm customer={customer} /> : null;
}

// Dane klienta we własnej granicy <Suspense> — patrz strona zamówień.
export default async function DetailsPage() {
  const t = await getTranslations("account");

  return (
    <div className="flex flex-col gap-14">
      <AccountSection title={t("profile.title")}>
        <Suspense fallback={<AccountLoading />}>
          <Profile />
        </Suspense>
      </AccountSection>
      <AccountSection title={t("password.title")}>
        <PasswordForm />
      </AccountSection>
    </div>
  );
}
