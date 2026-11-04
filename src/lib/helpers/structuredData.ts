import { Currency } from "@/contracts/shared";
import {
  ProductJsonLd,
  ProductProps,
  ReturnPolicyJsonLd,
  SchemaAvailability,
  ShippingDetailsJsonLd,
} from "@/contracts/server/product";
import { CHECKOUT_COUNTRIES, RETURN_WINDOW_DAYS } from "@/content/data";
import { getUnitPrice } from "@/lib/helpers/currency";
import { SITE_NAME } from "@/lib/helpers/metadata";
import { getLowestShippingCost } from "@/lib/helpers/shipping";

// Google zna tylko prawdziwe kraje, więc regiony z listy kasy (Irlandia
// Północna, „XI”) pomijamy: dla Google'a są częścią Wielkiej Brytanii i jej
// ceny wysyłki — nie niższej, więc niczego nie obiecujemy za tanio.
const GOOGLE_COUNTRIES = CHECKOUT_COUNTRIES.filter(({ region }) => !region);

// Wysyłka dla Google: najtańsza dostawa do każdego kraju z kasy, w walucie
// ceny, z krajami zebranymi po stawce (np. 50 zł — paczkomaty InPost
// International). Cennik i lista krajów to te same dane co w kasie, więc
// zmiana stawki przechodzi tu sama.
const buildShippingDetails = (currency: Currency): ShippingDetailsJsonLd[] => {
  const countriesByCost = new Map<number, string[]>();
  for (const { code } of GOOGLE_COUNTRIES) {
    const cost = getLowestShippingCost(code, currency);
    countriesByCost.set(cost, [...(countriesByCost.get(cost) ?? []), code]);
  }
  return [...countriesByCost].map(([value, countries]) => ({
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value, currency: currency.toUpperCase() },
    shippingDestination: countries.map((addressCountry) => ({
      "@type": "DefinedRegion",
      addressCountry,
    })),
  }));
};

// Czasu dostawy (deliveryTime) świadomie nie podajemy: regulamin mówi tylko
// o 3–5 dniach roboczych na przygotowanie, a czasu transportu po stronie
// przewoźnika nie obiecuje — Google pokazałby go jako naszą obietnicę.
const RETURN_POLICY: ReturnPolicyJsonLd = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: GOOGLE_COUNTRIES.map(({ code }) => code),
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: RETURN_WINDOW_DAYS,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
};

type ProductJsonLdInput = {
  product: ProductProps;
  // Pełny adres tej strony produktu (getPageUrl).
  url: string;
  // Waluta, którą strona pokazuje na starcie — patrz getDefaultCurrency.
  currency: Currency;
  // Goły tekst, bez HTML-a; pusty = pole pominięte.
  description: string;
};

// Dane produktu dla Google: nazwa, cena, dostępność i zdjęcia (S4 w audycie),
// od 2026-11-04 także koszt wysyłki i zasady zwrotów.
// Powstają z tego samego produktu z WooCommerce co strona, więc nowa praca,
// zmiana ceny czy sprzedaż przechodzą tu same.
//
// Cena jest w walucie, którą strona pokazuje na starcie (po polsku zł, po
// angielsku €), bo Google odrzuca dane, w których cena nie zgadza się z tą
// widoczną na stronie. Bez ceny nie ma czego opisać: Google wymaga oferty, a
// strona pisze wtedy „Cena niedostępna" — stąd null.
export const buildProductJsonLd = ({
  product,
  url,
  currency,
  description,
}: ProductJsonLdInput): ProductJsonLd | null => {
  if (!product.hasPrice) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    sku: String(product.id),
    image: product.images.map((image) => image.src),
    ...(description && { description }),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      price: getUnitPrice(product, currency),
      priceCurrency: currency.toUpperCase(),
      availability: product.inStock
        ? SchemaAvailability.InStock
        : SchemaAvailability.SoldOut,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
      shippingDetails: buildShippingDetails(currency),
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
  };
};
