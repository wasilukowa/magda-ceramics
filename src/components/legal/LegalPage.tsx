// Wspólna oprawa stron z treścią prawną: regulaminu, polityki prywatności
// i „Wysyłki i zwrotów". Same sekcje rysuje LegalSections; `children` pozwala
// wpleść między nie coś więcej niż tekst — na przykład tabelę stawek.
export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {title}
      </h1>
      <div className="space-y-8 text-sm text-[var(--muted)] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
