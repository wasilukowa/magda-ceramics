import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import LegalPage from "@/components/legal/LegalPage";
import LegalSections, { LegalHeading } from "@/components/legal/LegalSections";
import ShippingRatesTable from "@/components/legal/ShippingRatesTable";
import { SHIPPING_INTRO, SHIPPING_DETAILS } from "@/content/legal/shipping";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shipping" });
  return { title: `${t("pageTitle")} — Magda Ceramics` };
}

// Wysyłka i zwroty w jednym miejscu. Dotąd oba linki ze stopki prowadziły do
// kotwic w regulaminie — klient dostawał paragrafy zamiast odpowiedzi na
// pytanie „ile i kiedy". Regulamin zostaje pełną treścią, tutaj jest
// streszczenie plus tabela stawek liczona z tych samych danych co checkout.
export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shipping" });
  const key = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  return (
    <LegalPage title={t("pageTitle")}>
      <LegalSections sections={SHIPPING_INTRO[key]} />

      <section>
        <LegalHeading>{t("ratesTitle")}</LegalHeading>
        <div className="space-y-3">
          <ShippingRatesTable />
          <p>{t("ratesNote")}</p>
        </div>
      </section>

      <LegalSections sections={SHIPPING_DETAILS[key]} />
    </LegalPage>
  );
}
