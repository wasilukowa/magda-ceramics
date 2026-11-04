import { Country, CookieRegistryEntry, NavLinkType, StaticRoute } from "./types";
import { ShippingZone, ShippingRates } from "@/contracts/server/shipping";
import { CookieCategory } from "@/contracts/shared";

// Co siedzi pod „Pracownią" w menu — na komputerze w rozwijanej liście, na
// telefonie pod nagłówkiem. Dodanie pozycji to jeden wiersz tutaj (plus nazwa
// w messages/*.json pod „nav").
export const STUDIO_LINKS: NavLinkType[] = [
  { route: "/about/ceramics", labelKey: "ceramics" },
  { route: "/reviews", labelKey: "reviews" },
  { route: "/contact", labelKey: "contact" },
];

// Zdjęcia w sliderze na stronie głównej, w kolejności pokazywania. Kolejność
// ustala numer na początku nazwy pliku (01-, 02-, …) i lista poniżej musi iść
// tak samo — strona nie czyta folderu, tylko tę listę. Żeby przestawić zdjęcia:
// zmień numery w nazwach plików i tutaj. Pliki leżą w public/slider/. Żeby
// usunąć zdjęcie: skasuj wiersz tutaj (i sam plik, jeśli ma zniknąć
// z repozytorium). Żeby dodać: wrzuć plik do public/slider/ i dopisz wiersz.
// Slider przycina zdjęcie do swojej ramki (na komputerze prawie pionowej, na
// telefonie prawie kwadratowej), więc najważniejsze powinno być blisko środka
// kadru.
export const HERO_SLIDER_PHOTOS: string[] = [
  "/slider/01-dsc-1746.jpg",
  "/slider/02-dsc-0132.jpg",
  "/slider/06-dsc-1388.jpg",
  "/slider/07-dsc-1412.jpg",
  "/slider/08-dsc-1427.jpg",
  "/slider/09-dsc-1505.jpg",
  "/slider/10-dsc-1578.jpg",
  "/slider/11-dsc-1641.jpg",
  "/slider/12-dsc-1650.jpg",
  "/slider/13-dsc-2100.jpg",
  "/slider/14-dsc-2397.jpg",
  "/slider/15-dsc-2554.jpg",
  "/slider/16-dsc-2644.jpg",
  "/slider/17-dsc-2821.jpg",
  "/slider/18-dsc-3036.jpg",
  "/slider/19-dsc-3576.jpg",
  "/slider/20-dsc-3610.jpg",
  "/slider/21-dsc-3746.jpg",
  "/slider/22-dsc-3750.jpg",
  "/slider/23-dsc-8101.jpg",
  "/slider/24-dsc-8516.jpg",
  "/slider/25-dsc-9112.jpg",
  "/slider/26-dsc-9290.jpg",
  "/slider/27-dsc-9316.jpg",
  "/slider/28-dsc-9581.jpg",
  "/slider/29-dsc-9815.jpg",
  "/slider/30-dsc-7519.jpg",
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
// logowania ani ulubionych — to strony do używania,
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

// Only countries the studio actually ships to: Poland, the EU countries below
// and the United Kingdom. Other destinations are intentionally excluded —
// shipping there is too costly. See SHIPPING_RATES below for the amounts.
// Kolejność = kolejność na liście krajów w kasie i w adresach na koncie.
//
// „XI” to nie kod kraju, tylko kod, którym UE oznacza Irlandię Północną (VAT,
// cło). Natalia chciała ją jako osobną pozycję na liście (2026-11-04), bo ma
// tańszą wysyłkę niż reszta Wielkiej Brytanii. Sklep używa „XI” wewnątrz,
// a do Stripe'a i WooCommerce idzie „GB” — patrz toPostalCountry
// i getShopCountry w lib/helpers/shipping.ts.
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
  {
    code: "XI",
    label: "Northern Ireland",
    names: { pl: "Irlandia Północna" },
    zone: ShippingZone.NorthernIreland,
    region: { country: "GB", postcodePrefix: "BT", stateName: "Northern Ireland" },
  },
  { code: "IE", label: "Ireland", zone: ShippingZone.Ireland },
  { code: "CZ", label: "Czech Republic", zone: ShippingZone.RestEu },
  { code: "SE", label: "Sweden", zone: ShippingZone.RestEu },
  { code: "DK", label: "Denmark", zone: ShippingZone.RestEu },
  { code: "FI", label: "Finland", zone: ShippingZone.RestEu },
];

// Ile dni ma konsument na odstąpienie od umowy, licząc od odebrania paczki —
// regulamin (§ o odstąpieniu) i strona „Wysyłka i zwroty". Idzie też do
// danych produktu dla Google (structuredData.ts); przy zmianie poprawić
// wszystkie trzy miejsca.
export const RETURN_WINDOW_DAYS = 14;

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
// smallest unit (grosze for PLN, euro cents for EUR, pence for GBP). Customers
// pay in the currency they browse in, so each rate has a price point in every
// currency.
// Cennik od Natalii, 2026-10-07:
// · Polska — paczkomat i kurier: 20 zł / 5 €
// · paczkomaty InPost International (BE, FR, ES, NL, LU, PT, IT): 50 zł / 11,50 €;
//   kurier do tych samych krajów: 80 zł / 18 €
// · Niemcy i Austria — tylko kurier: 55 zł / 12 €
// · Wielka Brytania — tylko kurier: 95 zł / 21 € / 18 £
// · pozostałe kraje — kurier: 80 zł / 18 €
// Dwie kwoty spoza cennika, wyliczone po kursie sklepu: Polska w euro
// (20 zł / 4,30 = 4,65 → 5 €) i kurier za 18 € w złotych (18 × 4,30 = 77,40
// → 80 zł, w górę do pełnej piątki jak reszta cennika).
// Funty (2026-10-26): złote po kursie 5,20 w górę do pełnego funta — 4, 10,
// 16, 11 i 16 £. Wyjątek to Wielka Brytania: 18 £ od Natalii (z kursu
// wyszłoby 19).
// Dopisane 2026-11-04 (kwoty w euro od Natalii, złote i funty tą samą regułą):
// · Irlandia Północna — tylko kurier: 20 € → 86 zł → 90 zł → 17,31 £ → 18 £
// · Irlandia — tylko kurier: 25 € → 107,50 zł → 110 zł → 21,15 £ → 22 £
export const SHIPPING_RATES: ShippingRates = {
  [ShippingZone.Poland]: {
    locker: { pln: 2000, eur: 500, gbp: 400 },
    courier: { pln: 2000, eur: 500, gbp: 400 },
  },
  [ShippingZone.InPostEu]: {
    locker: { pln: 5000, eur: 1150, gbp: 1000 },
    courier: { pln: 8000, eur: 1800, gbp: 1600 },
  },
  [ShippingZone.GermanyAustria]: {
    courier: { pln: 5500, eur: 1200, gbp: 1100 },
  },
  [ShippingZone.UnitedKingdom]: {
    courier: { pln: 9500, eur: 2100, gbp: 1800 },
  },
  [ShippingZone.NorthernIreland]: {
    courier: { pln: 9000, eur: 2000, gbp: 1800 },
  },
  [ShippingZone.Ireland]: {
    courier: { pln: 11000, eur: 2500, gbp: 2200 },
  },
  [ShippingZone.RestEu]: {
    courier: { pln: 8000, eur: 1800, gbp: 1600 },
  },
};
