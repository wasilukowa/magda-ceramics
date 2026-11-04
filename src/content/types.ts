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

// Trasy bez segmentów dynamicznych — te, które da się wskazać samym adresem,
// bez podawania produktu czy kategorii.
export type StaticRoute = Exclude<
  keyof typeof routing.pathnames,
  `${string}[${string}`
>;

// Adres wskazany na tyle dokładnie, że da się z niego policzyć link: trasa
// statyczna albo dynamiczna z kompletem parametrów. Używa go mapa strony
// (sitemap.ts) i metadane każdej podstrony (lib/helpers/metadata.ts).
export type AppRoute =
  | StaticRoute
  | { pathname: "/shop/[category]"; params: { category: string } }
  | { pathname: "/product/[slug]"; params: { slug: string } };

// Pozycja menu: dokąd prowadzi i pod jakim kluczem z „nav" w tłumaczeniach
// leży jej nazwa.
export type NavLinkType = {
  route: StaticRoute;
  labelKey: string;
};

// Adresy, na które wolno wskazać z dokumentu prawnego. Żaden paragraf nie
// linkuje do konkretnego produktu, więc wystarczą trasy statyczne.
export type LegalRoute = StaticRoute;

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

// --- Opinie kupujących -------------------------------------------------------
// Jedna opinia przeniesiona z profilu na Vinted. `author` to nick, pod którym
// opinia widnieje tam publicznie; treść zostaje w oryginalnym języku.
export type Review = {
  author: string;
  rating: number;
  text: string;
  // Wyróżnione trafiają do sliderów; strona „Opinie" pokazuje komplet.
  featured?: boolean;
};

// --- Opowieści Magdy: „O mnie" i „Moja ceramika" -----------------------------
// Obie strony są odwzorowane z jej dokumentów: akapity, śródtytuły i zdjęcia
// wplecione tam, gdzie ona je wstawiła. Zdjęcia idą grupami, bo tak u niej
// stoją — np. jedno pod akapitem o pierwszym kole, dwa pod akapitem
// o pierwszych pracach. Liczba zdjęć w grupie decyduje o układzie
// (components/StoryBlocks.tsx).
export type StoryPhoto = {
  src: string;
  // Wymiary pliku. Next potrzebuje ich, żeby zarezerwować miejsce i nie
  // przesuwać tekstu w trakcie ładowania — przy podmianie zdjęcia trzeba je
  // poprawić razem ze ścieżką. Oba siedzą obok siebie w stałej `PHOTO`
  // w `content/about.ts` albo `content/ceramics.ts`.
  width: number;
  height: number;
  // Opis dla czytników ekranu i dla wyszukiwarki — w języku danej wersji.
  alt: string;
};

export type StoryBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "photos"; photos: StoryPhoto[] };

export type AboutContent = {
  blocks: StoryBlock[];
  // Podpis pod tekstem; w widoku jest wyróżniony, stąd osobne pole. Łamanie
  // wiersza jest w nim znaczące („Ciepło pozdrawiam," i niżej „Magda").
  signature: string;
};

export type AboutByLocale = Record<Locale, AboutContent>;

// „Moja ceramika" ma w dokumencie Magdy własny tytuł („Od surowej kulki gliny
// do gotowego naczynia…"), który stoi nad tekstem większą czcionką.
export type CeramicsContent = AboutContent & {
  title: string;
};

export type CeramicsByLocale = Record<Locale, CeramicsContent>;

// --- Strona „Pytania i odpowiedzi" -------------------------------------------
// Pytania, które wracają najczęściej, pogrupowane tematycznie. `moreRoute`
// odsyła tam, gdzie temat jest opisany wiążąco (wysyłka, regulamin) — dzięki
// temu FAQ mówi krótko i po ludzku, a nie powiela paragrafów.
export type FaqEntry = {
  question: string;
  answer: string[];
  moreRoute?: StaticRoute;
  moreHash?: string;
  // Pytanie czeka na odpowiedź Magdy i DOPÓTY NIE TRAFIA NA STRONĘ. Lepiej
  // pokazać krótsze FAQ niż zmyśloną odpowiedź o tym, czy kubek wolno wstawić
  // do zmywarki.
  draft?: boolean;
};

export type FaqGroup = {
  heading: string;
  entries: FaqEntry[];
};

export type FaqByLocale = Record<Locale, FaqGroup[]>;
