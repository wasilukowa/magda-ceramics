import { getTranslations } from "next-intl/server";
import NotFoundView from "@/components/NotFoundView";

// Trasa musi dostać choć jeden konkretny adres do prerenderu. Bez tego Next
// próbuje przygotować „pustą skorupę" dla nieznanych parametrów, a wtedy
// zlokalizowane linki w Navbarze nie mają z czego policzyć adresu i build pada
// na „Uncached data was accessed outside of <Suspense>". Ten jeden adres jest
// szkieletem; pozostałe nieznane adresy renderują się na żądanie, gdzie język
// jest już znany.
export function generateStaticParams() {
  return [{ rest: ["404"] }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: `${t("title")} — Magda Ceramics`, robots: { index: false } };
}

// Everything under /[locale] that matches no real route ends up here.
//
// ‼️ NIE WOŁAĆ TU `notFound()`. Wyglądałoby to poprawniej (prawdziwy status 404),
// ale przy włączonym `cacheComponents` KOŃCZY SIĘ BIAŁYM EKRANEM BŁĘDU.
// Mechanizm, ustalony pomiarem strumienia RSC: layout `[locale]` świadomie NIE
// czeka na sesję i zgodę na ciasteczka, tylko podaje providerom same obietnice
// (bez tego build pada na „Uncached data was accessed outside of <Suspense>",
// sprawdzone). `notFound()` przerywa render, zanim te obietnice zdążą trafić do
// strumienia — przeglądarka dostaje odwołania do wierszy, które nigdy nie
// przychodzą, React rzuca „Connection closed", a całość ląduje na
// `global-error.tsx`: dwujęzyczny komunikat bez menu, stopki i drogi powrotnej.
// Dotyczyło to KAŻDEGO `notFound()` w aplikacji, nie tylko tej trasy.
//
// Dlatego widok 404 rysuje się tu wprost. Cena: odpowiedź ma status 200 zamiast
// 404. Rekompensuje to `robots: { index: false }` powyżej — wyszukiwarka i tak
// nie zaindeksuje tych adresów. Gdy Next naprawi zachowanie `notFound()` przy
// `cacheComponents`, wystarczy wrócić do `return notFound()`.
export default function CatchAllPage() {
  return <NotFoundView />;
}
