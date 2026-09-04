import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { hasLocale } from "next-intl";
import LegalPage from "@/components/legal/LegalPage";
import LegalSections from "@/components/legal/LegalSections";
import { PRIVACY } from "@/content/legal/privacy";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return buildPageMetadata({
    locale,
    route: "/privacy",
    title: t("privacyTitle"),
    descriptionKey: "pages.privacy",
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  const sections =
    PRIVACY[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];

  return (
    <LegalPage title={t("privacyTitle")}>
      <LegalSections sections={sections} />
    </LegalPage>
  );
}
