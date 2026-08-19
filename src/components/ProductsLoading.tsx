// Placeholder for the shop listing and category pages while WooCommerce
// answers. The shape matches the real page — heading, filter row, product grid
// — so nothing jumps when the products arrive.
export default function ProductsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse" aria-hidden="true">
      <div className="h-3 w-28 bg-[var(--color-ceramic)] mx-auto mb-12" />

      <div className="flex flex-wrap gap-3 justify-center mb-12">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-9 w-28 bg-[var(--color-ceramic)]" />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index}>
            <div className="aspect-square bg-[var(--color-ceramic)] mb-3" />
            <div className="h-3 w-3/4 bg-[var(--color-ceramic)] mb-2" />
            <div className="h-3 w-1/3 bg-[var(--color-ceramic)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
