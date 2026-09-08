"use client";

import { ReactNode, useEffect, useRef } from "react";

// Na telefonie rząd kategorii rozłaził się na cztery wiersze — 172 px przy
// szerokości 360 px, czyli tyle pustego miejsca przed pierwszym zdjęciem, ile
// zajmuje samo zdjęcie. Teraz jest to jeden przewijany pasek, który wychodzi
// poza margines strony, żeby po ucięciu ostatniego kafelka było widać, że da
// się go przesunąć. Od `sm` w górę wraca zawijanie na środku — tam wszystko
// mieści się i tak.
//
// Etykiety zostają w całości. Skracanie nazw kategorii było drugą drogą i
// zostało świadomie odrzucone: „Świeczniki i kadzielnice" ma się nazywać tak,
// jak nazwała to Magda.
export default function CategoryStrip({ children }: { children: ReactNode }) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Na stronie kategorii ta wybrana bywa poza kadrem — bez tego klient na
  // „Świecznikach" widziałby pasek zaczynający się od „Wszystkie" i nie
  // wiedział, gdzie stoi.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    // Gdy pasek mieści się w całości (komputer), przewijanie byłoby tylko
    // szarpnięciem widoku bez powodu.
    if (strip.scrollWidth <= strip.clientWidth) return;

    const active = strip.querySelector<HTMLElement>("[data-active='true']");
    if (!active) return;

    strip.scrollLeft =
      active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
  }, []);

  return (
    <div
      ref={stripRef}
      className="-mx-6 mb-10 flex snap-x gap-3 overflow-x-auto px-6 no-scrollbar sm:mx-0 sm:mb-12 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
    >
      {children}
    </div>
  );
}
