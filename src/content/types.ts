import { ShippingZone } from "@/contracts/server/shipping";

export type ShopCategory = {
  slug: string;
};

export type Country = {
  code: string;
  label: string;
  zone: ShippingZone;
};
