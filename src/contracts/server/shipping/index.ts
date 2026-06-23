export enum ShippingZone {
  Poland = "PL",
  InPostEu = "INPOST_EU",
  RestEu = "REST_EU",
}

// Native price points per currency, in the smallest unit (grosze / euro cents).
// These are deliberate flat rates set by the studio, not currency conversions.
export type ZoneRate = {
  pln: number;
  eur: number;
};

export type ShippingRates = Record<ShippingZone, ZoneRate>;
