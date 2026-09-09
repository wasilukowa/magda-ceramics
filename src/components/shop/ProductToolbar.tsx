"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProductSort } from "@/contracts/server/product";

// Sortowanie trzymamy w adresie, nie w stanie komponentu — link do
// „najtańszych kubków" ma się dać wysłać komuś dalej. Wartość domyślna znika
// z adresu, żeby czysty /sklep zostawał czystym /sklep.
//
// Filtru „tylko dostępne" już tu nie ma: sklep pokazuje wyłącznie to, co da się
// kupić, więc przycisk nie miałby czego odsiewać. Sprzedane prace są w archiwum.
type Props = {
  sort: ProductSort;
  count: number;
};

const SORT_OPTIONS = [
  ProductSort.Newest,
  ProductSort.PriceAsc,
  ProductSort.PriceDesc,
  ProductSort.NameAsc,
];

export default function ProductToolbar({ sort, count }: Props) {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const withParam = (key: string, value: string, isDefault: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (isDefault) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    // Bez `scroll: false` przeglądarka skakałaby na górę przy każdej zmianie
    // sortowania, a klient patrzy wtedy na siatkę, nie na nagłówek.
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    // Natywna lista rozmiarem odpowiada NAJDŁUŻSZEJ opcji („Cena malejąco",
    // a po angielsku „Price, low to high"), więc NIE WOLNO jej zwężać — przy
    // wymuszonej połówce ucinała wybraną wartość na „NAJNOWSZ…". Dlatego na
    // telefonie schodzi pod licznik pełną szerokością, a od 640 px wraca obok
    // niego i `sm:ml-auto` odsuwa ją do prawej krawędzi.
    <div className="flex flex-wrap items-center gap-3 mb-8 text-xs tracking-widest uppercase text-[var(--muted)]">
      <span>{t("count", { count })}</span>

      <label className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
        <span className="sr-only">{t("sortLabel")}</span>
        <select
          value={sort}
          onChange={(event) =>
            withParam(
              "sort",
              event.target.value,
              event.target.value === ProductSort.Newest
            )
          }
          className="w-full sm:w-auto border border-[var(--color-control-border)] bg-transparent px-3 py-2 sm:px-4 text-xs tracking-widest uppercase text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`sort.${option}`)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
