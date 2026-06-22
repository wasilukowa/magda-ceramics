import { getTranslations } from "next-intl/server";
import { getCurrentCustomer } from "@/lib/auth/dal";
import ProfileForm from "@/components/account/ProfileForm";
import AddressForm from "@/components/account/AddressForm";
import PasswordForm from "@/components/account/PasswordForm";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("nav.details")} — Magda Ceramics` };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-sm tracking-widest uppercase border-b border-[var(--border)] pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function DetailsPage() {
  const t = await getTranslations("account");
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <div className="flex flex-col gap-14">
      <Section title={t("profile.title")}>
        <ProfileForm customer={customer} />
      </Section>
      <Section title={t("address.title")}>
        <AddressForm billing={customer.billing} />
      </Section>
      <Section title={t("password.title")}>
        <PasswordForm />
      </Section>
    </div>
  );
}
