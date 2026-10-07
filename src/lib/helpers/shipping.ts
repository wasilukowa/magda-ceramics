import {
  CHECKOUT_COUNTRIES,
  INPOST_LOCKER_COUNTRIES,
  SHIPPING_RATES,
} from "@/content/data";
import {
  DeliveryMethod,
  ShippingOption,
  ShippingZone,
  ShippingZoneSummary,
  ZoneRate,
  ZoneRates,
} from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";

// Falls back to the rest-of-EU zone for any unknown code. The checkout only
// accepts codes from CHECKOUT_COUNTRIES (see isCheckoutCountry), so this only
// matters for orders placed before a country left the list.
export const getShippingZone = (countryCode: string): ShippingZone =>
  CHECKOUT_COUNTRIES.find((country) => country.code === countryCode)?.zone ??
  ShippingZone.RestEu;

// Czy w ogóle wysyłamy do tego kraju. Kasa pokazuje wyłącznie te kraje, więc
// kod spoza listy znaczy, że ktoś ominął formularz — a wtedy zamówienia nie
// przyjmujemy zamiast po cichu policzyć mu najdroższą strefę.
export const isCheckoutCountry = (countryCode: string): boolean =>
  CHECKOUT_COUNTRIES.some((country) => country.code === countryCode);

// Whether the customer can pick an InPost parcel locker for this country.
// Drives the locker/courier toggle and which Geowidget (PL vs International)
// is shown.
export const hasInPostLocker = (countryCode: string): boolean =>
  INPOST_LOCKER_COUNTRIES.includes(countryCode);

const isSameRate = (a: ZoneRate, b: ZoneRate): boolean =>
  a.pln === b.pln && a.eur === b.eur;

// Stawka za dostawę danym sposobem. Cena paczkomatu obowiązuje tylko tam,
// gdzie paczkomat naprawdę jest (kraj z paczkomatami, strefa z ceną za
// paczkomat) — w każdym innym wypadku liczy się kurier.
const getRate = (countryCode: string, method: DeliveryMethod): ZoneRate => {
  const { locker, courier } = SHIPPING_RATES[getShippingZone(countryCode)];
  return method === DeliveryMethod.Locker && locker && hasInPostLocker(countryCode)
    ? locker
    : courier;
};

// Sposób dostawy zamówienia: paczkomat tylko wtedy, gdy klient go wybrał,
// wskazał konkretny punkt, a w tym kraju paczkomaty są. Inaczej kurier.
export const resolveDeliveryMethod = (
  countryCode: string,
  requested: DeliveryMethod | undefined,
  hasLockerPoint: boolean
): DeliveryMethod =>
  requested === DeliveryMethod.Locker && hasLockerPoint && hasInPostLocker(countryCode)
    ? DeliveryMethod.Locker
    : DeliveryMethod.Courier;

// Sposób dostawy, od którego zależy cena — z nim kasa wycenia płatność. Tam,
// gdzie paczkomat kosztuje tyle co kurier (Polska), przełączenie nie zmienia
// kwoty, więc płatności nie trzeba zakładać od nowa (nowa płatność przeładowuje
// formularz i zamknęłaby klientowi otwartą mapę paczkomatów).
export const getPricedDeliveryMethod = (
  countryCode: string,
  method: DeliveryMethod
): DeliveryMethod => {
  const { locker, courier } = SHIPPING_RATES[getShippingZone(countryCode)];
  return locker && !isSameRate(locker, courier)
    ? resolveDeliveryMethod(countryCode, method, true)
    : DeliveryMethod.Courier;
};

// Shipping cost in the chosen currency's smallest unit (grosze / euro cents),
// for Stripe.
export const getShippingAmount = (
  countryCode: string,
  currency: Currency,
  method: DeliveryMethod
): number => getRate(countryCode, method)[currency];

// Shipping cost in major units, for display.
export const getShippingCost = (
  countryCode: string,
  currency: Currency,
  method: DeliveryMethod
): number => getShippingAmount(countryCode, currency, method) / 100;

// Shipping cost in zł, used for WooCommerce shipping_lines (orders are always
// recorded in the PLN store currency regardless of the paid currency).
export const getShippingCostInZloty = (
  countryCode: string,
  method: DeliveryMethod
): number => getRate(countryCode, method).pln / 100;

// Pozycje cennika strefy. Paczkomat i kurier w tej samej cenie to jedna
// pozycja, „paczkomat albo kurier".
const getShippingOptions = ({ locker, courier }: ZoneRates): ShippingOption[] => {
  if (!locker) return [{ methods: [DeliveryMethod.Courier], rate: courier }];
  if (isSameRate(locker, courier)) {
    return [
      { methods: [DeliveryMethod.Locker, DeliveryMethod.Courier], rate: courier },
    ];
  }
  return [
    { methods: [DeliveryMethod.Locker], rate: locker },
    { methods: [DeliveryMethod.Courier], rate: courier },
  ];
};

// Kolejność stref na stronie „Wysyłka i zwroty" — od najtańszej.
const ZONE_ORDER = [
  ShippingZone.Poland,
  ShippingZone.InPostEu,
  ShippingZone.GermanyAustria,
  ShippingZone.RestEu,
  ShippingZone.UnitedKingdom,
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
      options: getShippingOptions(SHIPPING_RATES[zone]),
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
