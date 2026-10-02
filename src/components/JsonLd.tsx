import { JsonLdProps } from "@/contracts/shared";

// Dane strukturalne dla wyszukiwarek. Zwykły <script>, nie next/script — to
// dane, a nie kod do uruchomienia. „<" zamieniamy na <, żeby nazwa albo
// opis z WooCommerce z „</script>" w środku nie zamknęły znacznika przed
// czasem (zalecenie z dokumentacji Nexta, guides/json-ld).
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
