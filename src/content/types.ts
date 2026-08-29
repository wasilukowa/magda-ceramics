import { ShippingZone } from "@/contracts/server/shipping";
import { CookieCategory, LegalBlockType } from "@/contracts/shared";
import { routing, Locale } from "@/i18n/routing";

export type Country = {
  code: string;
  label: string;
  zone: ShippingZone;
};

// One row of the cookie table on the cookie policy page. `key` points at the
// purpose and lifetime wording in the message catalogues.
export type CookieRegistryEntry = {
  key: string;
  name: string;
  provider: string;
  category: CookieCategory;
};

// --- Dokumenty prawne -------------------------------------------------------
// Regulamin, polityka prywatności i „Wysyłka i zwroty" siedzą w src/content/legal
// jako dane. Dzięki temu poprawka w paragrafie to edycja tekstu, a nie grzebanie
// w JSX-ie, i obie wersje językowe stoją obok siebie w jednym pliku.

// Adresy, na które wolno wskazać z dokumentu — tylko trasy bez segmentów
// dynamicznych, bo do produktu ani kategorii żaden paragraf nie linkuje.
export type LegalRoute = Exclude<
  keyof typeof routing.pathnames,
  `${string}[${string}`
>;

// Kawałek zdania. Bez `href`/`route` to zwykły tekst; `href` daje odnośnik
// zewnętrzny (dziś wyłącznie mailto:), `route` — wewnętrzny, świadomy języka.
export type LegalTextRun = {
  text: string;
  strong?: boolean;
  italic?: boolean;
  href?: string;
  route?: LegalRoute;
  // Kotwica w obrębie docelowej strony, np. „returns" dla § 5 regulaminu.
  hash?: string;
};

export type LegalBlock =
  | { type: LegalBlockType.Paragraph; content: LegalTextRun[] }
  | { type: LegalBlockType.List; items: LegalTextRun[][] };

export type LegalSection = {
  // Kotwica (np. „returns"), jeśli coś linkuje wprost do tej sekcji.
  id?: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocument = LegalSection[];

// Ten sam dokument w obu językach — pliki w content/legal eksportują właśnie to.
export type LegalDocumentByLocale = Record<Locale, LegalDocument>;
