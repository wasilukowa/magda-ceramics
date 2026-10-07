"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  DeliveryMethod,
  ShippingOption,
  ShippingZoneSummary,
} from "@/contracts/server/shipping";
import { useCurrency } from "@/hooks/useCurrency";
import { formatPrice } from "@/lib/helpers/currency";
import { getCountryLabel, getShippingZoneSummaries } from "@/lib/helpers/shipping";
import { cn } from "@/lib/utils";

// Stawki bierzemy z tych samych danych, na których liczy checkout, a kwotę
// pokazujemy w walucie wybranej w nagłówku — stąd komponent kliencki.
// Poniżej 640 px tabela zamienia się w karty, tak samo jak lista cookies:
// poziome przewijanie było dla klienta niewidoczne.
export default function ShippingRatesTable() {
  const t = useTranslations("shipping");
  const locale = useLocale();
  const { currency } = useCurrency();

  const summaries = getShippingZoneSummaries();

  const countryNames = (codes: string[]) =>
    codes.map((code) => getCountryLabel(code, locale));

  const countryList = (codes: string[]) => countryNames(codes).join(", ");

  // Strefa-grupa („Kraje z paczkomatami InPost") ma własną nazwę i listę
  // krajów pod nią. Pozostałe strefy nazywają się po prostu swoimi krajami
  // („Polska", „Niemcy i Austria") — powtarzanie ich pod spodem wyglądałoby
  // na pomyłkę.
  const isGroup = ({ zone }: ShippingZoneSummary) => t.has(`zones.${zone}`);

  const zoneLabel = (summary: ShippingZoneSummary) =>
    isGroup(summary)
      ? t(`zones.${summary.zone}`)
      : new Intl.ListFormat(locale, { type: "conjunction" }).format(
          countryNames(summary.countryCodes)
        );

  const countryDetail = (summary: ShippingZoneSummary) =>
    isGroup(summary) ? countryList(summary.countryCodes) : null;

  const deliveryLabel = ({ methods }: ShippingOption) =>
    methods.length > 1
      ? t("deliveryLockerOrCourier")
      : methods[0] === DeliveryMethod.Locker
        ? t("deliveryLocker")
        : t("deliveryCourier");

  const cost = ({ rate }: ShippingOption) =>
    formatPrice(rate[currency] / 100, currency);

  // Wiersze jednej strefy stoją ciasno pod sobą, odstęp jest dopiero od
  // kreski między strefami.
  const rowPadding = ({ options }: ShippingZoneSummary, index: number) =>
    cn(index === 0 ? "pt-3" : "pt-1", index === options.length - 1 && "pb-3");

  // Wyjątki warte przypisu: kraje bez paczkomatu w strefie, która poza nimi
  // paczkomaty ma. Strefy kurierskie w całości opisuje już kolumna „dostawa",
  // więc nie powtarzamy ich pod tabelą.
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
          {/* Strefa z dwoma cenami (paczkomat i kurier) zajmuje dwa wiersze,
              a jej nazwa stoi raz, na wysokość obu. Kreska oddziela strefy,
              nie wiersze wewnątrz strefy. */}
          {summaries.map((summary) => (
            <tbody key={summary.zone} className="border-b border-[var(--border)]">
              {summary.options.map((option, index) => (
                <tr key={option.methods.join("-")}>
                  {index === 0 && (
                    <td
                      rowSpan={summary.options.length}
                      className="py-3 pr-4 align-top"
                    >
                      <span className="block text-[var(--foreground)]">
                        {zoneLabel(summary)}
                      </span>
                      {countryDetail(summary) && (
                        <span className="block mt-1">{countryDetail(summary)}</span>
                      )}
                    </td>
                  )}
                  <td className={cn("pr-4 align-top", rowPadding(summary, index))}>
                    {deliveryLabel(option)}
                  </td>
                  <td
                    className={cn(
                      "align-top text-[var(--foreground)] whitespace-nowrap",
                      rowPadding(summary, index)
                    )}
                  >
                    {cost(option)}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {/* Na telefonie nagłówki kolumn znikają razem z tabelą, więc sposób
          dostawy wylądowałby kolejną linijką takiego samego szarego tekstu —
          tuż pod listą krajów, do złudzenia jak kolejny kraj. Dlatego u góry
          karty jest „dokąd", a pod kreską „czym i za ile", każdy sposób
          dostawy w osobnej linijce ze swoją ceną. */}
      <ul className="sm:hidden space-y-4">
        {summaries.map((summary) => (
          <li
            key={summary.zone}
            className="border border-[var(--border)] p-4 text-xs"
          >
            <span className="block text-[var(--foreground)] tracking-widest uppercase text-[10px]">
              {zoneLabel(summary)}
            </span>
            {countryDetail(summary) && (
              <p className="mt-2">{countryDetail(summary)}</p>
            )}
            <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1">
              {summary.options.map((option) => (
                <div
                  key={option.methods.join("-")}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span>{deliveryLabel(option)}</span>
                  <span className="text-[var(--foreground)] whitespace-nowrap">
                    {cost(option)}
                  </span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {courierOnlyExceptions.length > 0 && (
        <p>{t("courierOnlyNote", { countries: countryList(courierOnlyExceptions) })}</p>
      )}
    </div>
  );
}
