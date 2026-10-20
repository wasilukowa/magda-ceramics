"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { STUDIO_LINKS } from "@/content/data";

// „Pracownia" nie ma własnej strony — to sam nagłówek listy, więc jest
// przyciskiem, nie linkiem. Myszką lista otwiera się po najechaniu, tak jak
// „Sklep". Palcem (tablet od 768 px) i klawiaturą otwiera się kliknięciem,
// a zamyka ją kliknięcie obok, Escape albo wybór pozycji.
export default function StudioMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Kliknięcie myszką przychodzi już po najechaniu, które listę otworzyło —
  // zwykłe przełączanie zamykałoby ją wtedy pod kursorem.
  const pointerType = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <li
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => event.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="studio-menu"
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onClick={() => {
          const byMouse = pointerType.current === "mouse";
          pointerType.current = null;
          setOpen((prev) => byMouse || !prev);
        }}
        className="flex items-center gap-1.5 uppercase tracking-widest hover:opacity-60 transition-opacity"
      >
        {t("studio")}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        // Szersze niż rozwijane „Sklep": „Moja ceramika" / „My ceramics"
        // łamały się przy 160 px na dwa wiersze i lista wyglądała krzywo.
        <ul
          id="studio-menu"
          className="absolute top-full left-1/2 -translate-x-1/2 bg-[var(--color-navbar)] border border-[var(--color-navbar-border)] min-w-[200px] shadow-sm"
        >
          {STUDIO_LINKS.map((item) => (
            <li key={item.route}>
              <Link
                href={item.route}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-xs tracking-widest uppercase hover:bg-[var(--color-navbar-hover)] transition-colors"
              >
                {t(item.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
