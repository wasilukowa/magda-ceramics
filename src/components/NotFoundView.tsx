import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Widok „nie ma takiej strony". Wydzielony, bo rysują go dwa miejsca:
// `[locale]/not-found.tsx` (granica dla `notFound()`) oraz strony, które
// świadomie renderują go WPROST zamiast rzucać `notFound()` — patrz komentarz
// w `[locale]/[...rest]/page.tsx`.
//
// Język bierze się z `setRequestLocale()` w layoucie `[locale]`, więc komponent
// nie potrzebuje własnych parametrów.
export default async function NotFoundView() {
  const t = await getTranslations("notFound");

  return (
    <div className="max-w-3xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
      <Image
        src="/magda_round_one.svg"
        alt=""
        width={96}
        height={96}
        className="w-20 h-20 opacity-70"
      />

      <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted)]">404</p>
      <h1 className="text-2xl font-light tracking-wide">{t("heading")}</h1>
      <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md">
        {t("text")}
      </p>

      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <Link
          href="/shop"
          className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          {t("shop")}
        </Link>
        <Link
          href="/"
          className="text-xs tracking-widest uppercase border border-[var(--color-control-border)] px-8 py-3 hover:border-[var(--foreground)] transition-colors"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
