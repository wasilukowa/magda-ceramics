export enum ShippingZone {
  Poland = "PL",
  InPostEu = "INPOST_EU",
  GermanyAustria = "DE_AT",
  UnitedKingdom = "GB",
  RestEu = "REST_EU",
}

// How an order is delivered. Locker = picked on the InPost Geowidget map;
// Courier = shipped to the typed-in address. Lockers exist only in the
// countries listed in INPOST_LOCKER_COUNTRIES; everywhere else it is courier.
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

// Stawki jednej strefy: kurier jest wszędzie, paczkomat tylko tam, gdzie InPost
// ma paczkomaty. Paczkomat bywa tańszy od kuriera (InPost International),
// a w Polsce kosztuje tyle samo.
export type ZoneRates = {
  courier: ZoneRate;
  locker?: ZoneRate;
};

export type ShippingRates = Record<ShippingZone, ZoneRates>;

// Jedna pozycja cennika na stronie „Wysyłka i zwroty": sposób dostawy i jego
// cena. Sposoby w tej samej cenie (w Polsce paczkomat i kurier) idą razem.
export type ShippingOption = {
  methods: DeliveryMethod[];
  rate: ZoneRate;
};

// Jedna strefa tak, jak pokazuje ją strona „Wysyłka i zwroty": dokąd, czym
// i za ile. Składane z CHECKOUT_COUNTRIES i SHIPPING_RATES, żeby tabela na
// stronie nie mogła się rozjechać z tym, co naprawdę liczy checkout.
export type ShippingZoneSummary = {
  zone: ShippingZone;
  countryCodes: string[];
  options: ShippingOption[];
  // Kraje strefy, w których paczkomat NIE wchodzi w grę.
  courierOnlyCodes: string[];
};
