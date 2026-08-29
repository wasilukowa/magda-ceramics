"use client";

import { useLocale, useTranslations } from "next-intl";
import { ShippingZoneSummary, ZoneRate } from "@/contracts/server/shipping";
import { useCurrency } from "@/hooks/useCurrency";
import { formatPrice } from "@/lib/helpers/currency";
import { getCountryLabel, getShippingZoneSummaries } from "@/lib/helpers/shipping";

// Stawki bierzemy z tych samych danych, na których liczy checkout, a kwotę
// pokazujemy w walucie wybranej w nagłówku — stąd komponent kliencki.
// Poniżej 640 px tabela zamienia się w karty, tak samo jak lista cookies:
// poziome przewijanie było dla klienta niewidoczne.
export default function ShippingRatesTable() {
  const t = useTranslations("shipping");
  const locale = useLocale();
  const { currency } = useCurrency();

  const summaries = getShippingZoneSummaries();

  const countryList = (codes: string[]) =>
    codes.map((code) => getCountryLabel(code, locale)).join(", ");

  // Strefa jednokrajowa (Polska) nazywa się dokładnie tak jak ten kraj —
  // powtarzanie go pod nagłówkiem wyglądałoby na pomyłkę.
  const countryDetail = (codes: string[]) =>
    codes.length > 1 ? countryList(codes) : null;

  // Kurier bez wyboru paczkomatu tam, gdzie InPost nie dowozi do żadnego
  // punktu w całej strefie (dziś: reszta UE).
  const deliveryLabel = ({ countryCodes, courierOnlyCodes }: ShippingZoneSummary) =>
    courierOnlyCodes.length === countryCodes.length
      ? t("deliveryCourier")
      : t("deliveryLockerOrCourier");

  const cost = (rate: ZoneRate) => formatPrice(rate[currency] / 100, currency);

  // Wyjątki warte przypisu: kraje bez paczkomatu w strefie, która poza nimi
  // paczkomaty ma (dziś Austria). Strefy kurierskie w całości opisuje już
  // kolumna „dostawa", więc nie powtarzamy ich pod tabelą.
  const courierOnlyExceptions = summaries
    .filter((summary) => summary.courierOnlyCodes.length < summary.countryCodes.length)
    .flatMap((summary) => summary.courierOnlyCodes);

  return (
    <div className="space-y-3">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-3 pr-4 font-normal tracking-widest uppercase text-[10px]">
                {t("tableDestination")}
              </th>
              <th className="py-3 pr-4 font-normal tracking-widest uppercase text-[10px]">
                {t("tableDelivery")}
              </th>
              <th className="py-3 font-normal tracking-widest uppercase text-[10px] whitespace-nowrap">
                {t("tableCost")}
              </th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.zone} className="border-b border-[var(--border)]">
                <td className="py-3 pr-4 align-top">
                  <span className="block text-[var(--foreground)]">
                    {t(`zones.${summary.zone}`)}
                  </span>
                  {countryDetail(summary.countryCodes) && (
                    <span className="block mt-1">
                      {countryDetail(summary.countryCodes)}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 align-top">
                  {deliveryLabel(summary)}
                </td>
                <td className="py-3 align-top text-[var(--foreground)] whitespace-nowrap">
                  {cost(summary.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="sm:hidden space-y-4">
        {summaries.map((summary) => (
          <li
            key={summary.zone}
            className="border border-[var(--border)] p-4 space-y-2 text-xs"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[var(--foreground)] tracking-widest uppercase text-[10px]">
                {t(`zones.${summary.zone}`)}
              </span>
              <span className="text-[var(--foreground)] whitespace-nowrap">
                {cost(summary.rate)}
              </span>
            </div>
            {countryDetail(summary.countryCodes) && (
              <p>{countryDetail(summary.countryCodes)}</p>
            )}
            <p>{deliveryLabel(summary)}</p>
          </li>
        ))}
      </ul>

      {courierOnlyExceptions.length > 0 && (
        <p className="text-xs">
          {t("courierOnlyNote", { countries: countryList(courierOnlyExceptions) })}
        </p>
      )}
    </div>
  );
}
