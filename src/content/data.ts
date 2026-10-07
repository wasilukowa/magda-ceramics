import { Country, CookieRegistryEntry, StaticRoute } from "./types";
import { ShippingZone, ShippingRates } from "@/contracts/server/shipping";
import { CookieCategory } from "@/contracts/shared";

// Zdjęcia w sliderze na stronie głównej, w kolejności pokazywania (tej samej,
// co nazwy plików u Natalii, 2026-10-07: „a_" na początek, „w_" na koniec).
// Pliki leżą w public/slider/ (pomniejszone do 2000 px w dłuższym boku). Żeby
// usunąć zdjęcie: skasuj wiersz tutaj (i sam plik, jeśli ma zniknąć
// z repozytorium). Żeby dodać: wrzuć plik do public/slider/ i dopisz wiersz.
// Slider przycina zdjęcie do swojej ramki (na komputerze prawie pionowej, na
// telefonie prawie kwadratowej), więc najważniejsze powinno być blisko środka
// kadru. Zdjęcia, które stały tu wcześniej, są teraz na „Moja ceramika" —
// patrz CERAMICS_PHOTOS.
export const HERO_SLIDER_PHOTOS: string[] = [
  "/slider/dsc-1746.jpg",
  "/slider/dsc-1388.jpg",
  "/slider/dsc-1412.jpg",
  "/slider/dsc-1427.jpg",
  "/slider/dsc-1505.jpg",
  "/slider/dsc-1578.jpg",
  "/slider/dsc-1641.jpg",
  "/slider/dsc-1650.jpg",
  "/slider/dsc-2100.jpg",
  "/slider/dsc-8101.jpg",
  "/slider/dsc-9112.jpg",
  "/slider/dsc-9290.jpg",
  "/slider/dsc-9316.jpg",
  "/slider/dsc-9581.jpg",
  "/slider/dsc-9815.jpg",
  "/slider/dsc-0407.jpg",
  "/slider/dsc-1196.jpg",
];

// Everything the store writes to the customer's device, listed for the cookie
// policy page. Keep this in sync with the code — it is the informational duty
// under art. 399 PKE. Adding a new tracker means a row here AND a bump of
// CONSENT_VERSION in lib/helpers/consent.ts, so customers are asked again.
export const COOKIE_REGISTRY: CookieRegistryEntry[] = [
  {
    key: "session",
    name: "mc_session",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    // Remove this row together with the pre-launch gate in src/proxy.ts
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
    // Wygląd strony wybrany przełącznikiem (jasny / ciemny) — patrz ThemeProvider.
    key: "theme",
    name: "theme",
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
  {
    // Kopia listy z konta — patrz WishlistProvider (wspólna pamięć kart).
    key: "wishlistAccount",
    name: "wishlist:account",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
  {
    key: "wishlistHint",
    name: "wishlist:hinted",
    provider: "magdaceramics.com",
    category: CookieCategory.Necessary,
  },
];

// Dane pracowni — jedno miejsce dla regulaminu, polityki prywatności i strony
// „Wysyłka i zwroty". Zmiana adresu albo skrzynki to jedna linijka tutaj.
export const CONTACT_EMAIL = "info@magdaceramics.com";
export const STUDIO_NAME = "Magdalena Łęgowiak";
export const STUDIO_ADDRESS_PL = "Ul. Pełczyńskiego 14A/198, 01-471 Warszawa";
export const STUDIO_ADDRESS_EN = "Ul. Pełczyńskiego 14A/198, 01-471 Warsaw, Poland";

// Adres kanoniczny sklepu. Nie mylić z getBaseUrl() z lib/api.ts — tamto służy
// do wołania własnego API i zmienia się między środowiskami; ten jest jeden,
// bo mapa strony i podgląd linku muszą wskazywać na prawdziwą domenę.
export const SITE_URL = "https://www.magdaceramics.com";

// Strony, które mają trafić do mapy strony. Świadomie NIE MA tu kasy, konta,
// logowania, ulubionych ani zaślepki „coming soon" — to strony do używania,
// nie do znajdowania w wyszukiwarce. Trasy z segmentem dynamicznym (produkty,
// kategorie) dokłada sam sitemap.ts, prosto z WooCommerce.
export const SITEMAP_ROUTES: StaticRoute[] = [
  "/",
  "/shop",
  "/shop/archive",
  "/about",
  "/about/ceramics",
  "/reviews",
  "/faq",
  "/contact",
  "/shipping",
  "/terms",
  "/privacy",
  "/cookies",
  "/sitemap",
];

export const INSTAGRAM_URL = "https://www.instagram.com/magda_ceramics";
export const INSTAGRAM_HANDLE = "@magda_ceramics";

// Tytuł i opis zaślepki „coming soon". Dopóki stoi bramka, to jedyna strona,
// jaką widzi ktoś z zewnątrz — także w podglądzie linku na Instagramie czy
// w komunikatorze. Po angielsku, jak sama zaślepka.
export const COMING_SOON_META = {
  title: "Shop coming soon",
  description:
    "Handmade ceramics from a home studio in Warsaw — mugs, candle holders and vessels carved and painted by hand. The shop opens soon.",
  imageAlt: "Three handmade Magda Ceramics mugs held in someone's hands",
  photoAlt: "Handmade ceramics",
};

// Only countries the studio actually ships to: Poland, the EU countries below
// and the United Kingdom. Other destinations are intentionally excluded —
// shipping there is too costly. See SHIPPING_RATES below for the amounts.
export const CHECKOUT_COUNTRIES: Country[] = [
  { code: "PL", label: "Poland", zone: ShippingZone.Poland },
  { code: "FR", label: "France", zone: ShippingZone.InPostEu },
  { code: "NL", label: "Netherlands", zone: ShippingZone.InPostEu },
  { code: "BE", label: "Belgium", zone: ShippingZone.InPostEu },
  { code: "IT", label: "Italy", zone: ShippingZone.InPostEu },
  { code: "ES", label: "Spain", zone: ShippingZone.InPostEu },
  { code: "PT", label: "Portugal", zone: ShippingZone.InPostEu },
  { code: "LU", label: "Luxembourg", zone: ShippingZone.InPostEu },
  { code: "DE", label: "Germany", zone: ShippingZone.GermanyAustria },
  { code: "AT", label: "Austria", zone: ShippingZone.GermanyAustria },
  { code: "GB", label: "United Kingdom", zone: ShippingZone.UnitedKingdom },
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

// Flat shipping rates per zone and delivery method, in each currency's
// smallest unit (grosze for PLN, euro cents for EUR). Customers pay in the
// currency they browse in, so each rate has both a PLN and an EUR price point.
// Cennik od Natalii, 2026-10-07:
// · Polska — paczkomat i kurier: 20 zł / 5 €
// · paczkomaty InPost International (BE, FR, ES, NL, LU, PT, IT): 50 zł / 11,50 €;
//   kurier do tych samych krajów: 80 zł / 18 €
// · Niemcy i Austria — tylko kurier: 55 zł / 12 €
// · Wielka Brytania — tylko kurier: 95 zł / 21 € (Natalia podała też 18 £,
//   ale sklep nie przyjmuje funtów)
// · pozostałe kraje — kurier: 80 zł / 18 €
// Dwie kwoty spoza cennika, wyliczone po kursie sklepu: Polska w euro
// (20 zł / 4,30 = 4,65 → 5 €) i kurier za 18 € w złotych (18 × 4,30 = 77,40
// → 80 zł, w górę do pełnej piątki jak reszta cennika).
export const SHIPPING_RATES: ShippingRates = {
  [ShippingZone.Poland]: {
    locker: { pln: 2000, eur: 500 },
    courier: { pln: 2000, eur: 500 },
  },
  [ShippingZone.InPostEu]: {
    locker: { pln: 5000, eur: 1150 },
    courier: { pln: 8000, eur: 1800 },
  },
  [ShippingZone.GermanyAustria]: {
    courier: { pln: 5500, eur: 1200 },
  },
  [ShippingZone.UnitedKingdom]: {
    courier: { pln: 9500, eur: 2100 },
  },
  [ShippingZone.RestEu]: {
    courier: { pln: 8000, eur: 1800 },
  },
};
