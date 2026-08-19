import { Country, CookieRegistryEntry } from "./types";
import { ShippingZone, ShippingRates } from "@/contracts/server/shipping";
import { CookieCategory } from "@/contracts/shared";

// Everything the store writes to the customer's device, listed for the cookie
// policy page. Keep this in sync with the code — it is the informational duty
// under art. 399 PKE. Adding a new tracker means a row here AND a bump of
// CONSENT_VERSION in lib/helpers/consent.ts, so customers are asked again.
export const COOKIE_REGISTRY: CookieRegistryEntry[] = [
  {
    key: "session",
    name: "session",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    // Remove this row together with the pre-launch gate in src/middleware.ts
    key: "previewAccess",
    name: "preview_access",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    key: "consent",
    name: "cookie_consent",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    key: "cart",
    name: "cart",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    key: "pendingOrder",
    name: "pendingOrder",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    key: "stripe",
    name: "__stripe_mid, __stripe_sid",
    provider: "Stripe",
    category: CookieCategory.Necessary,
  },
  {
    key: "inpost",
    name: "InPost Geowidget",
    provider: "InPost",
    category: CookieCategory.Necessary,
  },
  {
    // Set by next-intl when the customer switches PL/EN in the navbar
    key: "locale",
    name: "NEXT_LOCALE",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    key: "currency",
    name: "currency",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    key: "wishlist",
    name: "wishlist",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
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
  { code: "PT", label: "Portugal", zone: ShippingZone.InPostEu },
  { code: "LU", label: "Luxembourg", zone: ShippingZone.InPostEu },
  { code: "DE", label: "Germany", zone: ShippingZone.RestEu },
  { code: "CZ", label: "Czech Republic", zone: ShippingZone.RestEu },
  { code: "SE", label: "Sweden", zone: ShippingZone.RestEu },
  { code: "DK", label: "Denmark", zone: ShippingZone.RestEu },
  { code: "FI", label: "Finland", zone: ShippingZone.RestEu },
];

// Countries where InPost parcel lockers can be picked on the Geowidget map.
// Poland uses the domestic Geowidget; the rest use the InPost International
// Geowidget (which only covers these ISO codes). Austria is intentionally
// absent — InPost has no lockers there, so it stays courier-only.
export const INPOST_LOCKER_COUNTRIES = [
  "PL",
  "FR",
  "NL",
  "BE",
  "IT",
  "ES",
  "PT",
  "LU",
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
