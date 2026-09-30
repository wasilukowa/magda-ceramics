import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/helpers/metadata";

// Kasa jest komponentem klienckim, a metadane da się podać tylko z serwera —
// stąd ten layout. Bez niego karta przeglądarki pokazywała samą nazwę sklepu,
// jakby klient był na stronie głównej. Kasa nie trafia do wyszukiwarki
// (robots.ts), więc wystarczy sam tytuł, bez canonical i podglądu. Dziedziczy
// go też strona potwierdzenia zamówienia.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: `${t("title")} — ${SITE_NAME}` };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
