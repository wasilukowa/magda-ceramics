export enum ShippingZone {
  Poland = "PL",
  InPostEu = "INPOST_EU",
  RestEu = "REST_EU",
}

// How a Polish order is delivered. Locker = picked on the InPost Geowidget map;
// Courier = shipped to the typed-in address. Only relevant for the Poland zone.
export enum DeliveryMethod {
  Locker = "locker",
  Courier = "courier",
}

// A parcel locker / ParcelPoint chosen on the InPost Geowidget. Trimmed down to
// just what the studio needs to ship the order (the code) and to show the
// customer what they picked (description + city/postcode).
export type InPostPoint = {
  code: string;
  description: string;
  city: string;
  postCode: string;
};

// Native price points per currency, in the smallest unit (grosze / euro cents).
// These are deliberate flat rates set by the studio, not currency conversions.
export type ZoneRate = {
  pln: number;
  eur: number;
};

export type ShippingRates = Record<ShippingZone, ZoneRate>;
