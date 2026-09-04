// Lista adresów, które Next ma zbudować z wyprzedzeniem (`generateStaticParams`),
// liczona z katalogu w WooCommerce.
//
// ‼️ TA LISTA NIE MOŻE WYJŚĆ PUSTA. Przy włączonym `cacheComponents` pusta lista
// to twardy błąd builda („EmptyGenerateStaticParamsError"), czyli deploy nie
// przechodzi WCALE. Zdarzyło się na Vercelu 2026-09-04: jedno zapytanie do
// WooCommerce przekroczyło limit czasu, `catch` zwrócił pustą listę i cały
// deploy padł — mimo że `catch` był napisany właśnie po to, żeby awaria
// WordPressa deployu nie kładła.
//
// Dlatego dwie warstwy obrony:
// 1. DRUGA PRÓBA po chwili. WooCommerce potrafi oddać 500 albo się zaciąć przy
//    jednym zapytaniu z kilkudziesięciu, a chwilę później odpowiada normalnie
//    (sprawdzone: to samo zapytanie curlem, trzy razy z rzędu, 200 w ~0,6 s).
//    Ponowienie ratuje najczęstszy przypadek i buduje PEŁNY katalog.
// 2. ZAŚLEPKA, gdy i druga próba zawiedzie. Jeden adres, żeby build miał co
//    zbudować; prawdziwe kubki policzą się przy pierwszym wejściu, gdy
//    WordPress wróci.
const RETRY_DELAY_MS = 3000;

// Ten sam wyraz, którym posługuje się trasa `[locale]/[...rest]`. Strona
// produktu i strona kategorii pokazują pod nim swój widok „nie znaleziono"
// (z `robots: noindex`), więc zaślepka niczego nie psuje.
export const PLACEHOLDER_PARAM = "404";

export async function staticParamsOrPlaceholder<T>(
  load: () => Promise<T[]>,
  placeholder: T
): Promise<T[]> {
  for (const attempt of [1, 2]) {
    try {
      const params = await load();
      if (params.length > 0) return params;
    } catch {
      // Cicho: od tego jest druga próba, a po niej zaślepka. Powód awarii
      // i tak wypisuje sam serwis produktów.
    }

    if (attempt === 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  return [placeholder];
}
