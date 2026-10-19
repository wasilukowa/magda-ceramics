"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  AccountFormState,
  Customer,
  SavedAddressInput,
  SavedDelivery,
  SavedLocker,
} from "@/contracts/server/auth";
import { getSession } from "@/lib/auth/dal";
import { customerService } from "@/lib/service/customer";
import {
  putSavedAddress,
  putSavedLocker,
  removeSavedAddress,
  removeSavedLocker,
} from "@/lib/service/customer/helpers";
import { findSavedAddress, MAX_SAVED_ITEMS } from "@/lib/helpers/savedDelivery";
import { hasInPostLocker, isCheckoutCountry } from "@/lib/helpers/shipping";
import { isPhoneNumber } from "@/utility";

// Zapisane adresy i paczkomaty zalogowanego klienta (zakładka „Adresy"
// i przyciski „Dodaj do moich…" w kasie, decyzja Natalii 2026-10-19).
// Akcje konta odświeżają stronę konta; akcje kasy nie — oddają nową listę,
// a kasa podmienia ją u siebie, nie ruszając tego, co klient wpisał.

type Messages = (key: string) => string;

const getAddressSchema = (t: Messages) =>
  z.object({
    firstName: z.string().trim().min(1, t("errors.firstName")).max(100),
    lastName: z.string().trim().min(1, t("errors.lastName")).max(100),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((phone) => !phone || isPhoneNumber(phone), t("errors.phone")),
    street: z.string().trim().min(1, t("errors.street")).max(200),
    street2: z.string().trim().max(200),
    postcode: z.string().trim().min(1, t("errors.postcode")).max(20),
    city: z.string().trim().min(1, t("errors.city")).max(100),
    country: z.string().refine(isCheckoutCountry, t("errors.country")),
  });

const lockerSchema = z.object({
  code: z.string().trim().min(1).max(40),
  description: z.string().trim().max(200),
  city: z.string().trim().max(100),
  postCode: z.string().trim().max(20),
  country: z.string().refine(hasInPostLocker),
});

const toSavedDelivery = (customer: Customer): SavedDelivery => ({
  firstName: customer.firstName,
  lastName: customer.lastName,
  addresses: customer.addresses,
  lockers: customer.lockers,
});

// Klient z sesji — null dla gościa i wtedy, gdy WooCommerce go nie zna.
const getSessionCustomer = async (): Promise<Customer | null> => {
  const session = await getSession();
  if (!session) return null;
  return customerService.getCustomerById(session.customerId);
};

const refreshAccount = () => revalidatePath("/account", "layout");

// --- Konto: zakładka „Adresy" ---

export async function saveAddress(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const t = await getTranslations("account");
  const read = (key: string) => String(formData.get(key) ?? "");

  const parsed = getAddressSchema(t).safeParse({
    firstName: read("firstName"),
    lastName: read("lastName"),
    phone: read("phone"),
    street: read("street"),
    street2: read("street2"),
    postcode: read("postcode"),
    city: read("city"),
    country: read("country"),
  });
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]]),
      ),
    };
  }

  try {
    const customer = await getSessionCustomer();
    if (!customer) return { status: "error", message: t("errors.unauthorized") };

    const id = read("id");
    const existing = customer.addresses.some((address) => address.id === id);
    if (!existing && customer.addresses.length >= MAX_SAVED_ITEMS) {
      return { status: "error", message: t("addresses.limit", { count: MAX_SAVED_ITEMS }) };
    }

    await customerService.setSavedAddresses(
      customer.id,
      putSavedAddress(customer.addresses, {
        id: existing ? id : crypto.randomUUID(),
        ...parsed.data,
      }),
    );
    refreshAccount();
    return { status: "success", message: t("addresses.saved") };
  } catch (error) {
    console.error("Save address failed:", error);
    return { status: "error", message: t("errors.server") };
  }
}

export async function deleteAddress(id: string): Promise<boolean> {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return false;
    await customerService.setSavedAddresses(
      customer.id,
      removeSavedAddress(customer.addresses, id),
    );
    refreshAccount();
    return true;
  } catch (error) {
    console.error("Delete address failed:", error);
    return false;
  }
}

// „Dodaj paczkomat" i „Zmień" (wtedy `replaces` to kod zmienianego).
export async function saveAccountLocker(
  locker: SavedLocker,
  replaces?: string,
): Promise<boolean> {
  const saved = await storeLocker(locker, replaces);
  if (saved) refreshAccount();
  return saved !== null;
}

export async function deleteLocker(code: string): Promise<boolean> {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return false;
    await customerService.setSavedLockers(customer.id, removeSavedLocker(customer.lockers, code));
    refreshAccount();
    return true;
  } catch (error) {
    console.error("Delete locker failed:", error);
    return false;
  }
}

// --- Kasa ---

// Zapisane dane do wpisania w kasie. Null dla gościa i przy awarii — kasa
// działa wtedy jak dotąd, klient wpisuje wszystko sam.
export async function getSavedDelivery(): Promise<SavedDelivery | null> {
  try {
    const customer = await getSessionCustomer();
    return customer ? toSavedDelivery(customer) : null;
  } catch (error) {
    console.error("Saved delivery lookup failed:", error);
    return null;
  }
}

// „Dodaj do moich adresów". Adres, który już jest na liście, nie zapisuje się
// drugi raz. Null — nie zapisano (gość, błędny adres, pełna lista, awaria).
export async function rememberAddress(input: SavedAddressInput): Promise<SavedDelivery | null> {
  const t = await getTranslations("account");
  const parsed = getAddressSchema(t).safeParse(input);
  if (!parsed.success) return null;

  try {
    const customer = await getSessionCustomer();
    if (!customer) return null;
    if (findSavedAddress(customer.addresses, parsed.data)) return toSavedDelivery(customer);
    if (customer.addresses.length >= MAX_SAVED_ITEMS) return null;

    const updated = await customerService.setSavedAddresses(
      customer.id,
      putSavedAddress(customer.addresses, { id: crypto.randomUUID(), ...parsed.data }),
    );
    return toSavedDelivery(updated);
  } catch (error) {
    console.error("Remember address failed:", error);
    return null;
  }
}

// „Dodaj do moich paczkomatów".
export async function rememberLocker(locker: SavedLocker): Promise<SavedDelivery | null> {
  return storeLocker(locker);
}

async function storeLocker(
  locker: SavedLocker,
  replaces?: string,
): Promise<SavedDelivery | null> {
  const parsed = lockerSchema.safeParse(locker);
  if (!parsed.success) return null;

  try {
    const customer = await getSessionCustomer();
    if (!customer) return null;
    const isNew = !customer.lockers.some(
      (saved) => saved.code === parsed.data.code || saved.code === replaces,
    );
    if (isNew && customer.lockers.length >= MAX_SAVED_ITEMS) return null;

    const updated = await customerService.setSavedLockers(
      customer.id,
      putSavedLocker(customer.lockers, parsed.data, replaces),
    );
    return toSavedDelivery(updated);
  } catch (error) {
    console.error("Save locker failed:", error);
    return null;
  }
}
