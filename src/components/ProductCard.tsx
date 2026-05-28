import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ProductProps } from "@/contracts/server/product";

export default function ProductCard({ product }: { product: ProductProps }) {
  const image = product.images[0];

  return (
    <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} className="group">
      <div className="aspect-square bg-[var(--color-ceramic)] overflow-hidden mb-3">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs tracking-widest uppercase">
            No image
          </div>
        )}
      </div>
      <p className="text-xs tracking-widest uppercase text-[var(--foreground)]">{product.name}</p>
      <p className="text-sm text-[var(--muted)] mt-1">{product.price} zł</p>
    </Link>
  );
}
