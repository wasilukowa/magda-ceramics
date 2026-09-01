"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ProductAvailability,
  ProductSort,
} from "@/contracts/server/product";
import { cn } from "@/lib/utils";

// Sortowanie i filtr dostępności trzymamy w adresie, nie w stanie komponentu —
// link do „najtańszych dostępnych kubków" ma się dać wysłać komuś dalej.
// Wartość domyślna znika z adresu, żeby czysty /sklep zostawał czystym /sklep.
type Props = {
  sort: ProductSort;
  availability: ProductAvailability;
  count: number;
};

const SORT_OPTIONS = [
  ProductSort.Newest,
  ProductSort.PriceAsc,
  ProductSort.PriceDesc,
  ProductSort.NameAsc,
];

export default function ProductToolbar({ sort, availability, count }: Props) {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onlyInStock = availability === ProductAvailability.InStock;

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
    // a po angielsku „Price, low to high"), więc nie wolno jej zwężać — przy
    // wymuszonej połówce ucinała wybraną wartość na „NAJNOWSZ…". Dlatego na
    // telefonie pierwszy wiersz to licznik i filtr (`ml-auto` odsuwa filtr do
    // prawej krawędzi), a lista schodzi pod nie pełną szerokością. Od 640 px
    // `sm:w-auto` wciąga ją z powrotem i wychodzi dawny układ: licznik
    // z lewej, oba sterowania z prawej. Wcześniej przycisk i lista zawijały
    // się każde do własnego wiersza — trzy poziomy chromu nad pierwszym
    // zdjęciem produktu.
    <div className="flex flex-wrap items-center gap-3 mb-8 text-xs tracking-widest uppercase text-[var(--muted)]">
      <span>{t("count", { count })}</span>

      <button
        type="button"
        aria-pressed={onlyInStock}
        onClick={() =>
          withParam("availability", ProductAvailability.InStock, onlyInStock)
        }
        className={cn(
          "ml-auto border px-3 py-2 sm:px-4 tracking-widest uppercase whitespace-nowrap transition-colors",
          onlyInStock
            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
            : "border-[var(--border)] hover:border-[var(--foreground)]"
        )}
      >
        {t("onlyInStock")}
      </button>

      <label className="flex items-center gap-2 w-full sm:w-auto">
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
          className="w-full sm:w-auto border border-[var(--border)] bg-transparent px-3 py-2 sm:px-4 text-xs tracking-widest uppercase text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
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
