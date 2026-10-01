import type { Appearance, CustomFontSource } from "@stripe/stripe-js";
import { SITE_URL } from "@/content/data";

// Formularz płatności Stripe'a żyje w ramce (iframe) z innej domeny, więc NIE
// widzi ani naszych zmiennych CSS, ani kroju pisma załadowanego przez
// next/font. `var(--background)` czy `var(--font-montserrat)` podane Stripe'owi
// wprost są po cichu ignorowane — przez to formularz pisał Times New Roman
// i świecił fioletem Stripe'a.
//
// Dlatego krój idzie osobno, a kolory odczytujemy z tokenów w globals.css już
// w przeglądarce. Tokeny zostają jedynym źródłem prawdy: zmiana koloru marki
// w CSS przenosi się też do płatności.
//
// Krój leży u nas (public/fonts/montserrat, licencja SIL OFL w OFL.txt), a nie
// w Google Fonts: z Google każdy klient w kasie zostawiałby Google'owi swój
// adres IP. Pliki pochodzą z pakietu @fontsource/montserrat 5.3.0 — wagi
// 300–600, jak wcześniej, w dwóch zakresach znaków („latin-ext" niesie polskie
// litery). Ramka Stripe'a pobiera je z naszej domeny, dlatego next.config.ts
// zezwala na to nagłówkiem CORS, a bramka w proxy.ts je przepuszcza.
const FONT_DIR = "/fonts/montserrat";
const FONT_WEIGHTS = ["300", "400", "500", "600"] as const;
const FONT_SUBSETS = [
  {
    name: "latin",
    unicodeRange:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    name: "latin-ext",
    unicodeRange:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
] as const;

// Domena, z której Stripe pobierze krój: w przeglądarce bieżąca (działa też na
// podglądach Vercela), na serwerze — adres sklepu. Formularz i tak montuje się
// dopiero w przeglądarce.
const getOrigin = (): string =>
  typeof window === "undefined" ? SITE_URL : window.location.origin;

export const getStripeFonts = (): CustomFontSource[] => {
  const origin = getOrigin();
  return FONT_SUBSETS.flatMap(({ name, unicodeRange }) =>
    FONT_WEIGHTS.map((weight) => ({
      family: "Montserrat",
      src: `url(${origin}${FONT_DIR}/montserrat-${name}-${weight}-normal.woff2)`,
      weight,
      style: "normal" as const,
      display: "swap",
      unicodeRange,
    }))
  );
};

// Wartości zapasowe = dzisiejsze tokeny z globals.css. Potrzebne tylko wtedy,
// gdy zmiennej nie da się odczytać (np. literówka po zmianie nazwy tokenu).
const TOKEN_FALLBACKS = {
  "--background": "#faf9f7",
  "--foreground": "#1a1a1a",
  "--muted": "#6b6b6b",
  "--border": "#e5e2dc",
  "--color-control-border": "#8B8477",
  "--color-error": "#a8442a",
  "--color-success": "#4f6f52",
} as const;

type Token = keyof typeof TOKEN_FALLBACKS;

const readToken = (styles: CSSStyleDeclaration | null, name: Token): string =>
  styles?.getPropertyValue(name).trim() || TOKEN_FALLBACKS[name];

// Wygląd formularza płatności dopasowany do reszty kasy: Montserrat, ostre
// rogi, cienka ramka w kolorze kontrolek, etykiety drobnymi wersalikami.
// Bezpieczne także na serwerze: strona „Zapłać" w koncie renderuje formularz
// już tam, a serwer nie ma dokumentu — wcześniej kończyło się to błędem
// „getComputedStyle is not defined". Na serwerze idą wartości zapasowe;
// formularz Stripe'a i tak montuje się dopiero w przeglądarce, a tam tokeny są
// odczytywane na nowo.
export function getStripeAppearance(): Appearance {
  const styles =
    typeof document === "undefined"
      ? null
      : getComputedStyle(document.documentElement);
  const token = (name: Token) => readToken(styles, name);

  const background = token("--background");
  const foreground = token("--foreground");
  const muted = token("--muted");
  const border = token("--border");
  const controlBorder = token("--color-control-border");
  const error = token("--color-error");

  return {
    theme: "flat",
    variables: {
      fontFamily: "Montserrat, sans-serif",
      fontSizeBase: "13px",
      fontWeightNormal: "400",
      fontWeightMedium: "500",
      fontWeightBold: "500",
      colorPrimary: foreground,
      colorBackground: background,
      colorText: foreground,
      colorTextSecondary: muted,
      colorTextPlaceholder: muted,
      colorDanger: error,
      colorSuccess: token("--color-success"),
      colorIcon: muted,
      borderRadius: "0px",
      spacingUnit: "4px",
      spacingAccordionItem: "8px",
      accordionItemLabelFontSize: "11px",
      accordionItemLabelFontWeight: "400",
      accordionItemLabelSelectedFontWeight: "500",
    },
    rules: {
      ".AccordionItem": {
        border: `1px solid ${border}`,
        boxShadow: "none",
        backgroundColor: background,
        padding: "16px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      },
      ".AccordionItem:hover": {
        color: foreground,
      },
      ".AccordionItem--selected": {
        border: `1px solid ${foreground}`,
      },
      ".Input": {
        border: `1px solid ${controlBorder}`,
        backgroundColor: background,
        boxShadow: "none",
        padding: "12px",
      },
      ".Input:focus": {
        border: `1px solid ${foreground}`,
        boxShadow: "none",
        outline: "none",
      },
      ".Input--invalid": {
        border: `1px solid ${error}`,
        boxShadow: "none",
        color: foreground,
      },
      ".Label": {
        fontSize: "10px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: muted,
        marginBottom: "6px",
      },
      ".Error": {
        fontSize: "12px",
        color: error,
      },
    },
  };
}
