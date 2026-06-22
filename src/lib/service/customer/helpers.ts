import {
  Customer,
  CustomerAddress,
  RawWcAddress,
  RawWcCustomer,
} from "@/contracts/server/auth";
import { OrderProps, OrderStatus, RawOrder } from "@/contracts/server/order";
import { isCorrectNumber } from "@/utility";

export const WISHLIST_META_KEY = "mc_wishlist";

const prepareAddress = (raw: RawWcAddress | undefined): CustomerAddress => ({
  firstName: raw?.first_name ?? "",
  lastName: raw?.last_name ?? "",
  phone: raw?.phone ?? "",
  street: raw?.address_1 ?? "",
  city: raw?.city ?? "",
  postcode: raw?.postcode ?? "",
  country: raw?.country || "PL",
});

const prepareWishlist = (raw: RawWcCustomer): number[] => {
  const meta = raw.meta_data?.find((m) => m.key === WISHLIST_META_KEY);
  if (!meta) return [];

  let value = meta.value;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(value)) return [];
  return value.map(Number).filter(isCorrectNumber);
};

export const prepareCustomer = (raw: RawWcCustomer): Customer => ({
  id: raw.id,
  email: raw.email,
  firstName: raw.first_name ?? raw.billing?.first_name ?? "",
  lastName: raw.last_name ?? raw.billing?.last_name ?? "",
  billing: prepareAddress(raw.billing),
  wishlist: prepareWishlist(raw),
});

const toOrderStatus = (status: string): OrderStatus =>
  Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : OrderStatus.Pending;

export const prepareOrder = (raw: RawOrder): OrderProps => ({
  id: raw.id,
  number: raw.number,
  status: toOrderStatus(raw.status),
  dateCreated: raw.date_created,
  total: raw.total,
  currency: raw.currency,
  items: (raw.line_items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    total: item.total,
  })),
});
