// Zastępstwo strony zamówienia, dopóki nie przyjdą dane z WooCommerce.
export default function OrderLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-hidden="true">
      <div className="h-3 w-1/2 bg-[var(--color-ceramic)]" />
      <div className="h-24 bg-[var(--color-ceramic)]" />
      <div className="h-40 bg-[var(--color-ceramic)]" />
      <div className="h-12 bg-[var(--color-ceramic)]" />
    </div>
  );
}
