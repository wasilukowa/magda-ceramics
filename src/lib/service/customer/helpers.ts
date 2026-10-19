import {
  Customer,
  RawWcCustomer,
  SavedAddress,
  SavedLocker,
} from "@/contracts/server/auth";
import { isCorrectNumber, isRecord, isString } from "@/utility";

export const WISHLIST_META_KEY = "mc_wishlist";
// Zapisane adresy i paczkomaty — listy w danych klienta, najnowsze pierwsze.
export const ADDRESSES_META_KEY = "mc_addresses";
export const LOCKERS_META_KEY = "mc_lockers";

// Numer adresu sprzed zakładki „Adresy" — tego jedynego z dawnego formularza
// w „Moich danych" (pole „billing" klienta w WooCommerce).
export const BILLING_ADDRESS_ID = "billing";

// Wartość z danych klienta. WooCommerce oddaje tablice zapisane przez API
// jako tablice, a czasem jako tekst JSON — oba kształty są w użyciu.
const readMeta = (raw: RawWcCustomer, key: string): { found: boolean; value: unknown } => {
  const meta = raw.meta_data?.find((m) => m.key === key);
  if (!meta) return { found: false, value: undefined };
  if (!isString(meta.value)) return { found: true, value: meta.value };
  try {
    return { found: true, value: JSON.parse(meta.value) };
  } catch {
    return { found: true, value: undefined };
  }
};

const readText = (record: Record<string, unknown>, key: string): string =>
  isString(record[key]) ? record[key] : "";

const prepareWishlist = (raw: RawWcCustomer): number[] => {
  const { value } = readMeta(raw, WISHLIST_META_KEY);
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter(isCorrectNumber);
};

const prepareSavedAddress = (value: unknown): SavedAddress | null => {
  if (!isRecord(value)) return null;
  const address: SavedAddress = {
    id: readText(value, "id"),
    firstName: readText(value, "firstName"),
    lastName: readText(value, "lastName"),
    phone: readText(value, "phone"),
    street: readText(value, "street"),
    street2: readText(value, "street2"),
    postcode: readText(value, "postcode"),
    city: readText(value, "city"),
    country: readText(value, "country"),
  };
  return address.id && address.street && address.country ? address : null;
};

// Dopóki klient nie zapisał niczego w zakładce „Adresy", jego listą jest
// adres z dawnego formularza — żeby nikomu nie zniknął.
const prepareSavedAddresses = (raw: RawWcCustomer): SavedAddress[] => {
  const { found, value } = readMeta(raw, ADDRESSES_META_KEY);
  if (found) {
    return Array.isArray(value)
      ? value.map(prepareSavedAddress).filter((address) => address !== null)
      : [];
  }

  const billing = raw.billing;
  if (!billing?.address_1) return [];
  return [
    {
      id: BILLING_ADDRESS_ID,
      firstName: billing.first_name ?? "",
      lastName: billing.last_name ?? "",
      phone: billing.phone ?? "",
      street: billing.address_1,
      street2: billing.address_2 ?? "",
      postcode: billing.postcode ?? "",
      city: billing.city ?? "",
      country: billing.country || "PL",
    },
  ];
};

const prepareSavedLocker = (value: unknown): SavedLocker | null => {
  if (!isRecord(value)) return null;
  const locker: SavedLocker = {
    code: readText(value, "code"),
    description: readText(value, "description"),
    city: readText(value, "city"),
    postCode: readText(value, "postCode"),
    country: readText(value, "country"),
  };
  return locker.code && locker.country ? locker : null;
};

const prepareSavedLockers = (raw: RawWcCustomer): SavedLocker[] => {
  const { value } = readMeta(raw, LOCKERS_META_KEY);
  return Array.isArray(value)
    ? value.map(prepareSavedLocker).filter((locker) => locker !== null)
    : [];
};

// Nowy adres na początek listy, poprawiony zostaje na swoim miejscu.
export const putSavedAddress = (
  addresses: SavedAddress[],
  address: SavedAddress
): SavedAddress[] =>
  addresses.some((saved) => saved.id === address.id)
    ? addresses.map((saved) => (saved.id === address.id ? address : saved))
    : [address, ...addresses];

export const removeSavedAddress = (addresses: SavedAddress[], id: string): SavedAddress[] =>
  addresses.filter((saved) => saved.id !== id);

// Nowy paczkomat na początek listy. „Zmień" (`replaces` — kod paczkomatu,
// który klient zmienia) wstawia nowy w miejsce starego. Ten sam kod nigdy nie
// stoi na liście dwa razy.
export const putSavedLocker = (
  lockers: SavedLocker[],
  locker: SavedLocker,
  replaces?: string
): SavedLocker[] => {
  const index = replaces ? lockers.findIndex((saved) => saved.code === replaces) : -1;
  const rest = lockers.filter((saved) => saved.code !== locker.code && saved.code !== replaces);
  if (index === -1) return [locker, ...rest];
  const position = Math.min(index, rest.length);
  return [...rest.slice(0, position), locker, ...rest.slice(position)];
};

export const removeSavedLocker = (lockers: SavedLocker[], code: string): SavedLocker[] =>
  lockers.filter((saved) => saved.code !== code);

export const prepareCustomer = (raw: RawWcCustomer): Customer => ({
  id: raw.id,
  email: raw.email,
  firstName: raw.first_name ?? raw.billing?.first_name ?? "",
  lastName: raw.last_name ?? raw.billing?.last_name ?? "",
  addresses: prepareSavedAddresses(raw),
  lockers: prepareSavedLockers(raw),
  wishlist: prepareWishlist(raw),
  modifiedAt: raw.date_modified_gmt ?? "",
});
