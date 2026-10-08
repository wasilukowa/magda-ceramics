import type { ImageProps as NextImageProps } from "next/image";
import {
  CategoryProps,
  CategoryTileProps,
  ProductJsonLd,
  ProductProps,
} from "@/contracts/server/product";

export enum Currency {
  PLN = "pln",
  EUR = "eur",
}

// Wygląd strony. Wartość trafia do atrybutu data-theme na <html> i do pamięci
// przeglądarki, więc to te same słowa, co w globals.css.
export enum Theme {
  Light = "light",
  Dark = "dark",
}

export type ImageProps = {
  src: string;
  alt: string;
};

export type ProductGalleryProps = {
  images: ImageProps[];
  productName: string;
};

// Przyciski sklepu — patrz components/ui/button.tsx. Główny to czarne tło,
// biały napis i strzałka; drugorzędny stoi obok głównego (np. „Wstecz") i ma
// sam obrys, ale w pełnym kolorze tekstu, żeby nie wyglądał na nieaktywny.
export enum ButtonVariant {
  Primary = "primary",
  Secondary = "secondary",
}

// Default — przycisk na szerokość napisu; Block — na całą szerokość kolumny
// (kasa, koszyk, karta produktu).
export enum ButtonSize {
  Default = "default",
  Block = "block",
}

// Slider zdjęć (strona główna, „Moja ceramika"). Opisy zdjęć składa strona,
// bo każda mówi o nich co innego. `sizes` jak w next/image — slider wypełnia
// ramkę rodzica, więc tylko strona wie, jak szeroka ona jest.
export type PhotoSliderProps = {
  photos: ImageProps[];
  sizes: string;
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

// Karta produktu na listingach. `soldOutLabel` przychodzi z zewnątrz, bo karta
// bywa rysowana i po stronie serwera (sklep, strona główna), i po stronie
// klienta (ulubione) — nie ma jednego sposobu, w jaki mogłaby sama sięgnąć po
// tłumaczenie. Bez etykiety plakietka po prostu się nie rysuje.
export type ProductCardProps = {
  product: ProductProps;
  soldOutLabel?: string;
  // Karty z pierwszego ekranu ładują zdjęcie od razu, zamiast czekać, aż
  // przewinięcie je „odkryje" — patrz ProductCard.
  eager?: boolean;
  // Archiwum nie pokazuje ceny — cena i opis są dopiero na stronie
  // produktu (decyzja Natalii 2026-10-07).
  hidePrice?: boolean;
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
  image: string;
  inStock: boolean;
  hasPrice: boolean;
  // Czeka na czyjąś wpłatę — „niedostępne" zamiast „sprzedane".
  reserved?: boolean;
};

// Why the category page has nothing to show: the slug matches no category at
// all, or the category exists but currently holds no purchasable products.
export enum EmptyCategoryReason {
  Unknown = "unknown",
  NoProducts = "no-products",
}

export type EmptyCategoryProps = {
  reason: EmptyCategoryReason;
  categoryLabel: string;
  // Categories worth suggesting — prepared by the service (non-empty, current
  // one excluded, each with a thumbnail).
  categories: CategoryTileProps[];
};

// Menu, footer and homepage tiles all render the same WooCommerce categories,
// fetched once by the locale layout.
export type CategoryNavigationProps = {
  categories: CategoryProps[];
};

// Wspólny kształt propsów przełączników w nawigacji (waluta, język).
export type SwitcherProps = {
  className?: string;
};

// Dokumenty prawne (regulamin, polityka prywatności, wysyłka i zwroty) leżą
// w src/content/legal jako dane, nie jako JSX. Blok to najmniejszy kawałek
// treści, jaki widok umie narysować — akapit albo lista wypunktowana.
export enum LegalBlockType {
  Paragraph = "paragraph",
  List = "list",
}

export type JsonLdProps = {
  data: ProductJsonLd;
};

// Obrazek w dwóch wersjach: na jasne i na ciemne tło (np. czarne logo i jego
// jasna kopia). Reszta ustawień jak w next/image.
export type ThemedImageProps = Omit<NextImageProps, "src"> & {
  src: string;
  darkSrc: string;
};
