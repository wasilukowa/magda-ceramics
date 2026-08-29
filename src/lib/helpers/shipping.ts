import {
  CHECKOUT_COUNTRIES,
  INPOST_LOCKER_COUNTRIES,
  SHIPPING_RATES,
} from "@/content/data";
import { ShippingZone, ShippingZoneSummary } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";

// Falls back to the most expensive (rest-of-EU) zone for any unknown code,
// so we never undercharge if the country list and rates drift apart.
export const getShippingZone = (countryCode: string): ShippingZone =>
  CHECKOUT_COUNTRIES.find((country) => country.code === countryCode)?.zone ??
  ShippingZone.RestEu;

// Whether the customer can pick an InPost parcel locker for this country.
// Drives the locker/courier toggle and which Geowidget (PL vs International)
// is shown.
export const hasInPostLocker = (countryCode: string): boolean =>
  INPOST_LOCKER_COUNTRIES.includes(countryCode);

// Shipping cost in the chosen currency's smallest unit (grosze / euro cents),
// for Stripe.
export const getShippingAmount = (
  countryCode: string,
  currency: Currency
): number => SHIPPING_RATES[getShippingZone(countryCode)][currency];

// Shipping cost in major units, for display.
export const getShippingCost = (
  countryCode: string,
  currency: Currency
): number => getShippingAmount(countryCode, currency) / 100;

// Shipping cost in zł, used for WooCommerce shipping_lines (orders are always
// recorded in the PLN store currency regardless of the paid currency).
export const getShippingCostInZloty = (countryCode: string): number =>
  SHIPPING_RATES[getShippingZone(countryCode)].pln / 100;

// Kolejność stref na stronie „Wysyłka i zwroty" — od najtańszej.
const ZONE_ORDER = [
  ShippingZone.Poland,
  ShippingZone.InPostEu,
  ShippingZone.RestEu,
];

// Stawki zebrane po strefach, prosto z tych samych danych, na których liczy
// checkout. Dzięki temu zmiana ceny wysyłki w SHIPPING_RATES od razu widać
// na stronie informacyjnej — nie ma drugiej listy do pilnowania.
export const getShippingZoneSummaries = (): ShippingZoneSummary[] =>
  ZONE_ORDER.map((zone) => {
    const countries = CHECKOUT_COUNTRIES.filter((country) => country.zone === zone);
    return {
      zone,
      countryCodes: countries.map((country) => country.code),
      rate: SHIPPING_RATES[zone],
      courierOnlyCodes: countries
        .filter((country) => !hasInPostLocker(country.code))
        .map((country) => country.code),
    };
  });

// Nazwa kraju w języku klienta, prosto z przeglądarki/Node — bez własnego
// słownika do utrzymania. Gdyby środowisko nie znało kodu (albo w ogóle nie
// miało Intl.DisplayNames), zostaje angielska nazwa z CHECKOUT_COUNTRIES,
// a na końcu sam kod. Używane i na stronie „Wysyłka i zwroty", i w kasie —
// to jedno miejsce decyduje, jak nazywamy kraje w całym sklepie.
export const getCountryLabel = (countryCode: string, locale: string): string => {
  const fallback =
    CHECKOUT_COUNTRIES.find((country) => country.code === countryCode)?.label ??
    countryCode;

  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(countryCode) ??
      fallback
    );
  } catch {
    return fallback;
  }
};
