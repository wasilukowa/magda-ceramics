"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PhotoSliderProps } from "@/contracts/shared";

// Wypełnia ramkę rodzica (wysokość i proporcje ustawia strona) i przycina
// zdjęcia do niej, więc najważniejsze powinno być blisko środka kadru.
export function PhotoSlider({ photos, sizes }: PhotoSliderProps) {
  const t = useTranslations("photoSlider");
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1));

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-[var(--color-accent)]">
      {photos.map((photo, i) => (
        <div
          key={photo.src}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className="object-cover"
            sizes={sizes}
            preload={i === 0}
          />
        </div>
      ))}

      <button
        onClick={prev}
        aria-label={t("prev")}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[var(--background)]/70 text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
      </button>

      <button
        onClick={next}
        aria-label={t("next")}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[var(--background)]/70 text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            onClick={() => setCurrent(i)}
            aria-label={t("goTo", { number: i + 1 })}
            className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ background: i === current ? "white" : "rgba(255,255,255,0.45)" }}
          />
        ))}
      </div>
    </div>
  );
}
