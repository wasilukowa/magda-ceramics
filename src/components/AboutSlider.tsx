"use client";

import { useState } from "react";
import Image from "next/image";

const PHOTOS = [1, 2, 3, 4, 5, 6, 7].map((n) => `/o-mnie/magda-o-mnie-${n}.jpg`);

export function AboutSlider() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? PHOTOS.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === PHOTOS.length - 1 ? 0 : c + 1));

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-[var(--color-accent)]">
      {PHOTOS.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={src}
            alt={`Magda ceramics ${i + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={i === 0}
          />
        </div>
      ))}

      <button
        onClick={prev}
        aria-label="Poprzednie zdjęcie"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/70 hover:bg-white transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
      </button>

      <button
        onClick={next}
        aria-label="Następne zdjęcie"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/70 hover:bg-white transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Zdjęcie ${i + 1}`}
            className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ background: i === current ? "white" : "rgba(255,255,255,0.45)" }}
          />
        ))}
      </div>
    </div>
  );
}
