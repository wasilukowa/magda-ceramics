import { QuoteProps } from "@/contracts/shared";

export function Quote({ text, author }: QuoteProps) {
  return (
    <section className="bg-[var(--color-surface)]">
      <figure className="max-w-[820px] mx-auto px-6 py-20 md:py-28 text-center">
        <span
          aria-hidden
          className="block font-quote text-[5rem] leading-[0.6] text-[var(--color-accent)] select-none"
        >
          &ldquo;
        </span>
        <blockquote className="mt-6">
          <p className="font-quote italic font-light text-[1.5rem] md:text-[2rem] leading-[1.55] text-[var(--foreground)]">
            {text}
          </p>
        </blockquote>
        <figcaption className="mt-10 flex flex-col items-center gap-5">
          <span className="w-10 h-px bg-[var(--color-accent)]" />
          <cite className="not-italic text-xs tracking-[0.3em] uppercase text-[var(--muted)]">
            {author}
          </cite>
        </figcaption>
      </figure>
    </section>
  );
}
