import type { Appearance, CssFontSource } from "@stripe/stripe-js";

// Formularz płatności Stripe'a żyje w ramce (iframe) z innej domeny, więc NIE
// widzi ani naszych zmiennych CSS, ani kroju pisma załadowanego przez
// next/font. `var(--background)` czy `var(--font-montserrat)` podane Stripe'owi
// wprost są po cichu ignorowane — przez to formularz pisał Times New Roman
// i świecił fioletem Stripe'a.
//
// Dlatego krój idzie osobno, z Google Fonts (ten sam Montserrat co na stronie),
// a kolory odczytujemy z tokenów w globals.css już w przeglądarce. Tokeny
// zostają jedynym źródłem prawdy: zmiana koloru marki w CSS przenosi się też
// do płatności.
export const STRIPE_FONTS: CssFontSource[] = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap",
  },
];

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

const readToken = (styles: CSSStyleDeclaration, name: Token): string =>
  styles.getPropertyValue(name).trim() || TOKEN_FALLBACKS[name];

// Wygląd formularza płatności dopasowany do reszty kasy: Montserrat, ostre
// rogi, cienka ramka w kolorze kontrolek, etykiety drobnymi wersalikami.
// Wołane tylko w przeglądarce — formularz Stripe'a i tak nie renderuje się na
// serwerze.
export function getStripeAppearance(): Appearance {
  const styles = getComputedStyle(document.documentElement);
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
