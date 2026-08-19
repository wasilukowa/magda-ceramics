// Placeholder for the account pages (overview, orders, details) while the
// customer data is fetched. It sits inside the account layout, so only the
// content column is drawn here.
export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse" aria-hidden="true">
      <div className="h-3 w-2/3 bg-[var(--color-ceramic)]" />

      <div className="grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 bg-[var(--color-ceramic)]" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-14 bg-[var(--color-ceramic)]" />
        ))}
      </div>
    </div>
  );
}
