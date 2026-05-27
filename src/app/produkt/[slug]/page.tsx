import { notFound } from "next/navigation";
import Link from "next/link";
import { productService } from "@/lib/service/product";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";

export async function generateStaticParams() {
  const products = await productService.getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  if (!product) return { title: "Product — Magda Ceramics" };
  return { title: `${product.name} — Magda Ceramics` };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <Link
        href="/sklep"
        className="text-xs tracking-widest uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-10 inline-block"
      >
        ← Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-[var(--muted)] mb-2">
              {product.categories.map((c) => c.name).join(", ")}
            </p>
            <h1 className="text-2xl font-light tracking-wide">{product.name}</h1>
          </div>

          {product.hasPrice ? (
            <p className="text-xl tracking-wide">{product.price} zł</p>
          ) : (
            <p className="text-sm text-[var(--muted)] tracking-wide">Price unavailable</p>
          )}

          {product.shortDescription && (
            <div
              className="text-sm text-[var(--muted)] leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          <div className="space-y-3">
            <p className="text-xs tracking-widest uppercase text-[var(--muted)]">
              {product.inStock ? "In stock" : "Out of stock"}
            </p>
            <AddToCartButton
              id={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              image={product.images[0]?.src ?? ""}
              inStock={product.inStock}
              hasPrice={product.hasPrice}
            />
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
