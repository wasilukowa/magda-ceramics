import { CHECKOUT_COUNTRIES, SHIPPING_RATES } from "@/content/data";
import { ShippingZone } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";

// Falls back to the most expensive (rest-of-EU) zone for any unknown code,
// so we never undercharge if the country list and rates drift apart.
export const getShippingZone = (countryCode: string): ShippingZone =>
  CHECKOUT_COUNTRIES.find((country) => country.code === countryCode)?.zone ??
  ShippingZone.RestEu;

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
