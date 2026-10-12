// Etykieta MUSI otaczać pole. Wcześniej stała obok niego jako rodzeństwo, bez
// `htmlFor` — czytnik ekranu ogłaszał więc w kasie dziewięć pól „edycja tekstu,
// puste", bez nazwy, a kliknięcie w napis nie ustawiało w polu kursora.
// Każde pole zawiera dokładnie jedną kontrolkę, więc powiązanie przez
// zagnieżdżenie jest wystarczające i nie wymaga rozdawania identyfikatorów.
export default function CheckoutField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-widest uppercase text-[var(--muted)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

export const CHECKOUT_INPUT_CLASS =
  "w-full border border-[var(--color-control-border)] px-3 py-3 text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors";
