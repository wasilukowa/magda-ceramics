import { ShopCategory, Country } from "./types";
import { ShippingZone, ShippingRates } from "@/contracts/server/shipping";

export const SHOP_CATEGORIES: ShopCategory[] = [
  { slug: "kubki" },
  { slug: "miski" },
  { slug: "maluszki" },
  { slug: "wazony" },
  { slug: "roznosci" },
];

export const HOMEPAGE_CATEGORIES: ShopCategory[] = [
  { slug: "kubki" },
  { slug: "miski" },
  { slug: "maluszki" },
  { slug: "wazony" },
  { slug: "roznosci" },
];

export const INSTAGRAM_URL = "https://www.instagram.com/magda_ceramics";
export const INSTAGRAM_HANDLE = "@magda_ceramics";

// Only countries the studio actually ships to (Poland + EU). Non-EU
// destinations are intentionally excluded — shipping there is too costly.
// Zones: Poland flat rate, InPost International countries, and the rest of
// the EU (courier). See SHIPPING_RATES below for the amounts.
export const CHECKOUT_COUNTRIES: Country[] = [
  { code: "PL", label: "Poland", zone: ShippingZone.Poland },
  { code: "FR", label: "France", zone: ShippingZone.InPostEu },
  { code: "NL", label: "Netherlands", zone: ShippingZone.InPostEu },
  { code: "BE", label: "Belgium", zone: ShippingZone.InPostEu },
  { code: "AT", label: "Austria", zone: ShippingZone.InPostEu },
  { code: "IT", label: "Italy", zone: ShippingZone.InPostEu },
  { code: "ES", label: "Spain", zone: ShippingZone.InPostEu },
  { code: "DE", label: "Germany", zone: ShippingZone.RestEu },
  { code: "CZ", label: "Czech Republic", zone: ShippingZone.RestEu },
  { code: "SE", label: "Sweden", zone: ShippingZone.RestEu },
  { code: "DK", label: "Denmark", zone: ShippingZone.RestEu },
  { code: "FI", label: "Finland", zone: ShippingZone.RestEu },
];

// Flat shipping rates per zone, in each currency's smallest unit
// (grosze for PLN, euro cents for EUR). Customers pay in the currency they
// browse in, so each zone has both a PLN and an EUR price point.
// PL: 18 zł / 5 € · InPost International: 58 zł / 13 € · rest of EU: 75 zł / 17 €
export const SHIPPING_RATES: ShippingRates = {
  [ShippingZone.Poland]: { pln: 1800, eur: 500 },
  [ShippingZone.InPostEu]: { pln: 5800, eur: 1300 },
  [ShippingZone.RestEu]: { pln: 7500, eur: 1700 },
};
