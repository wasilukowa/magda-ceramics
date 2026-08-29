import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import LegalPage from "@/components/legal/LegalPage";
import LegalSections from "@/components/legal/LegalSections";
import { TERMS } from "@/content/legal/terms";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return { title: `${t("termsTitle")} — Magda Ceramics` };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  // Layout odsiewa nieznane języki wcześniej; `hasLocale` jest tu po to, żeby
  // TypeScript wiedział, że można sięgnąć do dokumentu po tym kluczu.
  const sections = TERMS[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];

  return (
    <LegalPage title={t("termsTitle")}>
      <LegalSections sections={sections} />
    </LegalPage>
  );
}
