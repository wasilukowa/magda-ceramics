export enum Currency {
  PLN = "pln",
  EUR = "eur",
}

export type ImageProps = {
  src: string;
  alt: string;
};

export type ProductGalleryProps = {
  images: ImageProps[];
  productName: string;
};

// Cookie categories in the order they are shown to the customer. "Necessary"
// covers storage exempt from consent under art. 399 PKE — the login session,
// the cart, the payment step, and preferences the customer sets themselves
// (currency, wishlist). It is always on and cannot be switched off.
// A new kind of storage (e.g. a chat widget) means a new category here plus a
// bump of CONSENT_VERSION.
export enum CookieCategory {
  Necessary = "necessary",
  Analytics = "analytics",
  Marketing = "marketing",
}

// The categories the customer actually decides about.
export type ConsentChoices = Record<
  Exclude<CookieCategory, CookieCategory.Necessary>,
  boolean
>;

// What gets stored in the consent cookie. `version` and `decidedAt` are the
// proof of consent: which wording was accepted, and when.
export type CookieConsent = {
  version: number;
  decidedAt: string;
  choices: ConsentChoices;
};

export type CookieCategoryToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  lockedNote?: string;
  onChange: (checked: boolean) => void;
};

export type QuoteProps = {
  text: string;
  author: string;
};

export type AddToCartButtonProps = {
  id: number;
  slug: string;
  name: string;
  price: string;
  priceEur: number | null;
  image: string;
  inStock: boolean;
  hasPrice: boolean;
};
