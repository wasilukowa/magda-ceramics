import { ShippingZone } from "@/contracts/server/shipping";
import { CookieCategory } from "@/contracts/shared";

export type ShopCategory = {
  slug: string;
};

export type Country = {
  code: string;
  label: string;
  zone: ShippingZone;
};

// One row of the cookie table on the cookie policy page. `key` points at the
// purpose and lifetime wording in the message catalogues.
export type CookieRegistryEntry = {
  key: string;
  name: string;
  provider: string;
  category: CookieCategory;
};
