import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ProductCardProps } from "@/contracts/shared";
import Price from "@/components/Price";

export default function ProductCard({ product, soldOutLabel }: ProductCardProps) {
  const image = product.images[0];
  const showSoldOut = !product.inStock && !!soldOutLabel;

  return (
    <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} className="group">
      <div className="relative aspect-square bg-[var(--color-ceramic)] overflow-hidden mb-3">
        {/* Produkt bez zdjęcia zostawia sam ceramiczny kafelek — wrapper ma
            już to tło. Wcześniej stał tu angielski napis „No image": nieprze-
            tłumaczony, więc widoczny tak samo na polskiej stronie, i ledwo
            czytelny na tym tle (kontrast 4,07:1). */}
        {image && (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Pasek u dołu zdjęcia, a nie w rogu — róg jest zajęty przez serduszko
            na liście ulubionych. Nie przykrywa zdjęcia, tylko jego skrawek. */}
        {showSoldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-[var(--background)]/90 py-2 text-center text-[10px] tracking-[0.2em] uppercase text-[var(--foreground)]">
            {soldOutLabel}
          </span>
        )}
      </div>
      <p className="text-xs tracking-widest uppercase text-[var(--foreground)]">{product.name}</p>
      <Price
        price={product.price}
        priceEur={product.priceEur}
        className="block text-sm text-[var(--muted)] mt-1"
      />
    </Link>
  );
}
