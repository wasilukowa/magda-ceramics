import { Currency } from "@/contracts/shared";
import {
  ProductJsonLd,
  ProductProps,
  SchemaAvailability,
} from "@/contracts/server/product";
import { getUnitPrice } from "@/lib/helpers/currency";
import { SITE_NAME } from "@/lib/helpers/metadata";

type ProductJsonLdInput = {
  product: ProductProps;
  // Pełny adres tej strony produktu (getPageUrl).
  url: string;
  // Waluta, którą strona pokazuje na starcie — patrz getDefaultCurrency.
  currency: Currency;
  // Goły tekst, bez HTML-a; pusty = pole pominięte.
  description: string;
};

// Dane produktu dla Google: nazwa, cena, dostępność i zdjęcia (S4 w audycie).
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
    },
  };
};
