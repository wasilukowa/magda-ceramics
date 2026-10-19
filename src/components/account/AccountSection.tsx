// Jedna sekcja strony konta: nagłówek z kreską i treść pod nim.
export default function AccountSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-sm tracking-widest uppercase border-b border-[var(--border)] pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
