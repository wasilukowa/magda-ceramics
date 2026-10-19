import { Address } from "@/contracts/server/cart";
import {
  SavedAddress,
  SavedAddressInput,
  SavedDelivery,
  SavedLocker,
} from "@/contracts/server/auth";
import { DeliveryMethod, InPostPoint } from "@/contracts/server/shipping";
import { getCountryLabel } from "@/lib/helpers/shipping";

// Zapisane adresy i paczkomaty klienta (zakładka „Adresy" w koncie, decyzja
// Natalii 2026-10-19) — to, co wspólne dla konta, kasy i serwera.

// Najwięcej adresów i najwięcej paczkomatów na jednym koncie. Lista trzyma
// się w danych klienta w WordPressie, więc nie może rosnąć bez końca.
export const MAX_SAVED_ITEMS = 10;

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
// „05-077", „05 077" i „05077" to ten sam kod.
const normalizePostcode = (value: string) => value.replace(/[\s-]/g, "").toLowerCase();

// Ten sam adres = ta sama koperta: ulica, druga linia, kod, miasto i kraj.
// Imię, nazwisko i telefon się nie liczą — to wciąż ten sam adres.
export const isSameAddress = (
  a: Pick<SavedAddressInput, "street" | "street2" | "postcode" | "city" | "country">,
  b: Pick<SavedAddressInput, "street" | "street2" | "postcode" | "city" | "country">
): boolean =>
  normalize(a.street) === normalize(b.street) &&
  normalize(a.street2) === normalize(b.street2) &&
  normalizePostcode(a.postcode) === normalizePostcode(b.postcode) &&
  normalize(a.city) === normalize(b.city) &&
  a.country === b.country;

export const findSavedAddress = (
  addresses: SavedAddress[],
  address: Pick<SavedAddressInput, "street" | "street2" | "postcode" | "city" | "country">
): SavedAddress | undefined => addresses.find((saved) => isSameAddress(saved, address));

export const isSavedLocker = (lockers: SavedLocker[], code: string): boolean =>
  lockers.some((locker) => locker.code === code);

// Kraj dopisujemy tylko spoza Polski — przy polskim adresie byłby zbędną
// linijką.
const getForeignCountry = (country: string, locale: string) =>
  country === "PL" ? "" : getCountryLabel(country, locale);

// Adres jak na kopercie (prośba Natalii 2026-10-19): imię i nazwisko, ulica,
// druga linia, kod i miasto, kraj.
export const getAddressLines = (address: SavedAddressInput, locale: string): string[] =>
  [
    `${address.firstName} ${address.lastName}`.trim(),
    address.street,
    address.street2,
    `${address.postcode} ${address.city}`.trim(),
    getForeignCountry(address.country, locale),
  ].filter(Boolean);

// Pod kodem paczkomatu: ulica, kod i miasto, kraj.
export const getLockerLines = (locker: SavedLocker, locale: string): string[] =>
  [
    locker.description,
    `${locker.postCode} ${locker.city}`.trim(),
    getForeignCountry(locker.country, locale),
  ].filter(Boolean);

// Adres z kasy w kształcie adresu do zapisania w koncie.
export const toSavedAddressInput = (address: Address): SavedAddressInput => ({
  firstName: address.firstName.trim(),
  lastName: address.lastName.trim(),
  phone: address.phone.trim(),
  street: address.street.trim(),
  street2: address.street2.trim(),
  postcode: address.postcode.trim(),
  city: address.city.trim(),
  country: address.country,
});

// Paczkomat z mapy w kształcie paczkomatu do zapisania — kraj dochodzi z kasy
// albo z konta, bo mapa pokazuje punkty jednego kraju.
export const toSavedLocker = (point: InPostPoint, country: string): SavedLocker => ({
  code: point.code,
  description: point.description,
  city: point.city,
  postCode: point.postCode,
  country,
});

export const toInPostPoint = ({ code, description, city, postCode }: SavedLocker): InPostPoint => ({
  code,
  description,
  city,
  postCode,
});

// Pola adresu, które kasa bierze z zapisanego adresu po jego wybraniu.
export const getAddressFields = (
  saved: SavedAddress
): Pick<Address, "street" | "street2" | "postcode" | "city" | "country"> => ({
  street: saved.street,
  street2: saved.street2,
  postcode: saved.postcode,
  city: saved.city,
  country: saved.country,
});

export type CheckoutPrefill = {
  address: Address;
  locker: InPostPoint | null;
  // Null — zostaje sposób dostawy, który kasa już ma.
  method: DeliveryMethod | null;
};

// Kasa u zalogowanego od razu wpisuje zapisane dane (decyzja Natalii
// 2026-10-19): imię i nazwisko z profilu, najnowszy adres, najnowszy
// paczkomat w kraju tego adresu. Niczego, co klient zdążył już wpisać albo
// wybrać, nie nadpisuje — zapisane dane przychodzą z WordPressa z opóźnieniem.
export const getCheckoutPrefill = (
  address: Address,
  locker: InPostPoint | null,
  saved: SavedDelivery
): CheckoutPrefill => {
  const [newestAddress] = saved.addresses;
  const [newestLocker] = saved.lockers;
  const addressUntouched =
    !address.street.trim() && !address.postcode.trim() && !address.city.trim();

  const fromAddress = addressUntouched && newestAddress ? getAddressFields(newestAddress) : {};
  // Sam paczkomat, bez adresu — kasa przechodzi na jego kraj.
  const fromLocker =
    addressUntouched && !newestAddress && newestLocker ? { country: newestLocker.country } : {};

  const filled: Address = {
    ...address,
    firstName: address.firstName || saved.firstName || newestAddress?.firstName || "",
    lastName: address.lastName || saved.lastName || newestAddress?.lastName || "",
    phone: address.phone || newestAddress?.phone || "",
    ...fromAddress,
    ...fromLocker,
  };

  const savedLocker = locker
    ? undefined
    : saved.lockers.find((candidate) => candidate.country === filled.country);

  // Sposób dostawy zmieniamy tylko klientowi, który niczego jeszcze nie
  // wpisał — wpisany ręcznie adres dla kuriera nie może zniknąć pod paczkomatem.
  const method = !addressUntouched
    ? null
    : savedLocker
      ? DeliveryMethod.Locker
      : newestAddress
        ? DeliveryMethod.Courier
        : null;

  return {
    address: filled,
    locker: locker ?? (savedLocker ? toInPostPoint(savedLocker) : null),
    method,
  };
};
