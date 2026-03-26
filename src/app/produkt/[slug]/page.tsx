import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProduct, getProducts } from "@/lib/woocommerce";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produkt — Magda Ceramics" };
  return { title: `${product.name} — Magda Ceramics` };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const mainImage = product.images[0];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <Link
        href="/sklep"
        className="text-xs tracking-widest uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-10 inline-block"
      >
        ← Sklep
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Zdjęcia */}
        <div className="space-y-3">
          <div className="aspect-square bg-[#e8e0d5] overflow-hidden">
            {mainImage ? (
              <Image
                src={mainImage.src}
                alt={mainImage.alt || product.name}
                width={800}
                height={800}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs tracking-widest uppercase">
                Brak zdjęcia
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img, i) => (
                <div key={i} className="aspect-square bg-[#e8e0d5] overflow-hidden">
                  <Image
                    src={img.src}
                    alt={img.alt || product.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informacje */}
        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-[var(--muted)] mb-2">
              {product.categories.map((c) => c.name).join(", ")}
            </p>
            <h1 className="text-2xl font-light tracking-wide">{product.name}</h1>
          </div>

          <p className="text-xl tracking-wide">{product.price} zł</p>

          {product.short_description && (
            <div
              className="text-sm text-[var(--muted)] leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          <div>
            {product.stock_status === "instock" ? (
              <p className="text-xs tracking-widest uppercase text-[var(--muted)]">Dostępny</p>
            ) : (
              <p className="text-xs tracking-widest uppercase text-[var(--muted)]">Niedostępny</p>
            )}
          </div>

          {product.description && (
            <div
              className="text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
