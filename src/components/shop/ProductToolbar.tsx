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
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-xs tracking-widest uppercase text-[var(--muted)]">
      <span>{t("count", { count })}</span>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={onlyInStock}
          onClick={() =>
            withParam(
              "availability",
              ProductAvailability.InStock,
              onlyInStock
            )
          }
          className={cn(
            "border px-4 py-2 tracking-widest uppercase transition-colors",
            onlyInStock
              ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
              : "border-[var(--border)] hover:border-[var(--foreground)]"
          )}
        >
          {t("onlyInStock")}
        </button>

        <label className="flex items-center gap-2">
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
            className="border border-[var(--border)] bg-transparent px-4 py-2 text-xs tracking-widest uppercase text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`sort.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
