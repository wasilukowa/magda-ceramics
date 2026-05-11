export default function ComingSoon() {
  return (
    <section className="fixed inset-0 z-50 bg-[#e8e0d5] flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
          Już wkrótce
        </p>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight text-[var(--foreground)]">
          Magda Ceramics
        </h1>
        <p className="mt-8 text-sm font-light text-[var(--muted)] tracking-wide">
          Sklep jest w przygotowaniu. Zapraszamy wkrótce.
        </p>
      </div>
    </section>
  );
}
