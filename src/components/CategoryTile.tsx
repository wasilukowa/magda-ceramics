import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { CategoryTileViewProps } from "@/contracts/shared";
import { cn } from "@/lib/utils";

// Kafelek kategorii: kwadratowe zdjęcie i nazwa pod nim, w stylu karty
// produktu. Zdjęcie przychodzi gotowe z serwisu (getCategoryTiles); bez
// zdjęcia zostaje sam ceramiczny kwadrat, tak jak w karcie produktu.
// Zdjęcie ma pusty `alt`, bo nazwa kategorii stoi tuż pod nim — opis kubka
// z WooCommerce czytany jako nazwa linku do całej kategorii tylko by mylił.
export default function CategoryTile({
  category,
  label,
  sizes,
  detail,
  className,
}: CategoryTileViewProps) {
  return (
    <Link
      href={{ pathname: "/shop/[category]", params: { category: category.slug } }}
      className={cn("group block", className)}
    >
      <div className="aspect-square bg-[var(--color-ceramic)] overflow-hidden mb-3">
        {category.image && (
          <Image
            src={category.image.src}
            alt=""
            width={400}
            height={400}
            sizes={sizes}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>
      <p className="text-xs tracking-widest uppercase text-[var(--foreground)]">
        {label}
      </p>
      {detail && <p className="text-sm text-[var(--muted)] mt-1">{detail}</p>}
    </Link>
  );
}
