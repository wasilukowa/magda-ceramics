"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { REVIEWS_SOURCE_URL } from "@/content/reviews";
import { Review } from "@/content/types";
import { cn } from "@/lib/utils";

// Opinie kupujących z Vinted, jedna na raz. Treści są cudze i zostają
// dokładnie takie, jakie napisali ich autorzy — także wtedy, gdy są po czesku
// albo po litewsku. Dlatego pod sekcją stoi jawna informacja, skąd pochodzą.
function Stars({
  rating,
  label,
  className,
}: {
  rating: number;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("flex gap-1", className)} role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          width="12"
          height="12"
          viewBox="0 0 20 20"
          aria-hidden="true"
          fill={index < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
        </svg>
      ))}
    </span>
  );
}

export default function ReviewsSlider({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("reviews");
  const [current, setCurrent] = useState(0);

  const total = reviews.length;

  const go = (step: number) => setCurrent((c) => (c + step + total) % total);

  if (total === 0) return null;

  return (
    <div>
      <div
        className="relative"
        role="group"
        aria-roledescription="carousel"
        aria-label={t("title")}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") go(-1);
          if (event.key === "ArrowRight") go(1);
        }}
        tabIndex={0}
      >
        {/* Opinie mają od czterech słów do czterech zdań, więc przy pokazywaniu
            jednej na raz strzałki podskakiwały przy każdym kliknięciu. Wszystkie
            leżą teraz w JEDNEJ komórce siatki — kontener jest wysoki jak
            najdłuższa z nich i nie zmienia wysokości. Bez magicznej liczby
            w pikselach, która i tak rozjechałaby się przy nowej opinii. */}
        <div className="grid">
          {reviews.map((item, index) => (
            <blockquote
              key={`${item.author}-${index}`}
              aria-hidden={index !== current}
              className={cn(
                "col-start-1 row-start-1 flex flex-col items-center justify-center text-center gap-4",
                "motion-safe:transition-opacity motion-safe:duration-500",
                index === current
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none select-none"
              )}
            >
              <Stars
                rating={item.rating}
                label={t("rating", { rating: item.rating })}
                className="text-[var(--color-rating)]"
              />
              <p className="text-sm leading-relaxed max-w-xl text-[var(--muted)]">{item.text}</p>
              <footer className="text-[10px] tracking-[0.25em] uppercase text-[var(--muted)]">
                {item.author}
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          {[
            { step: -1, label: t("previous"), path: "M10 3L5 8l5 5" },
            { step: 1, label: t("next"), path: "M6 3l5 5-5 5" },
          ].map(({ step, label, path }) => (
            <button
              key={label}
              type="button"
              onClick={() => go(step)}
              aria-label={label}
              className="w-9 h-9 flex items-center justify-center border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={path} />
              </svg>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-[10px] tracking-[0.25em] uppercase text-[var(--muted)]">
          {t("counter", { current: current + 1, total })}
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--muted)]">
        {t("source")}{" "}
        <a
          href={REVIEWS_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--foreground)] underline"
        >
          {t("sourceLink")}
        </a>
      </p>
    </div>
  );
}
