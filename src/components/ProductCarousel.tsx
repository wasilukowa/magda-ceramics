"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Karuzela prac na stronie głównej. Cztery kafelki na komputerze, trzy przy
// średnim ekranie, dwa na telefonie — reszta czeka za krawędzią i przesuwa się
// palcem albo strzałkami.
//
// Stoi na zwykłym przewijaniu w poziomie ze „snapowaniem", nie na bibliotece
// karuzel: dotyk i gładzik działają same z siebie, bez ani jednej linijki
// JavaScriptu, a strzałki są tylko dodatkiem dla myszy. Przy okazji nie ma tu
// nic, co mogłoby się zepsuć przed nawodnieniem strony.
export default function ProductCarousel({
  children,
  label,
}: {
  children: ReactNode;
  // Czym jest ta karuzela — trafia do etykiety dla czytnika ekranu.
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Dopóki wszystko mieści się na ekranie, strzałki są zbędne — martwy przycisk
  // jest gorszy niż jego brak.
  const [canScroll, setCanScroll] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const t = useTranslations("home");

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    // Jeden piksel luzu: przy ułamkowych szerokościach kafelków suma nigdy nie
    // wypada równo i koniec listy potrafi zameldować się o pół piksela wcześniej.
    const margines = 1;
    const maks = track.scrollWidth - track.clientWidth;

    setCanScroll(maks > margines);
    setAtStart(track.scrollLeft <= margines);
    setAtEnd(track.scrollLeft >= maks - margines);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    sync();
    // Zmiana szerokości okna zmienia liczbę widocznych kafelków, więc strzałki
    // muszą się przeliczyć — samo zdarzenie `scroll` tego nie złapie.
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
    // `children` w zależnościach nie jest ozdobnikiem: gdy ubędzie kafelków
    // (klient odlubił pracę w innym miejscu strony), sam obserwator rozmiaru
    // NIE zareaguje — szerokość toru się nie zmienia, zmienia się tylko jego
    // zawartość. Bez tego zostawały strzałki, które nie mają czego przewijać.
  }, [sync, children]);

  // Przesuwamy o pełną szerokość widoku, czyli o „stronę" kafelków.
  const przesun = (kierunek: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // ‼️ PRZEWIJANIE MUSI BYĆ NATYCHMIASTOWE. Na torze ze „snapowaniem"
    // (scroll-snap-type) Chrome kasuje KAŻDE płynne przewinięcie — i to
    // ustawione w wywołaniu (`behavior: "smooth"`), i to z CSS-a
    // (`scroll-behavior: smooth`). Kafelki nie ruszały się wtedy ani o piksel;
    // sprawdzone oboma sposobami. Snapowanie zostaje, bo to ono ustawia kafelki
    // równo przy przesuwaniu palcem — czyli tam, gdzie naprawdę pracuje.
    track.scrollBy({ left: kierunek * track.clientWidth, behavior: "instant" });

    // Przeliczamy od razu, zamiast czekać na zdarzenie `scroll`. Przewinięcie
    // jest natychmiastowe, więc nowa pozycja jest już znana — a stan strzałek
    // nie wisi wtedy na zdarzeniu, które w niektórych środowiskach po
    // przewinięciu skryptem w ogóle nie przychodzi.
    sync();
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") przesun(-1);
        if (event.key === "ArrowRight") przesun(1);
      }}
      tabIndex={0}
    >
      <div
        ref={trackRef}
        onScroll={sync}
        // `-mx-6 px-6` na telefonie: pasek wychodzi poza margines strony, żeby
        // ucięty kafelek mówił, że jest tam coś dalej.
        className="-mx-6 flex snap-x gap-6 overflow-x-auto px-6 no-scrollbar sm:mx-0 sm:px-0"
      >
        {children}
      </div>

      {canScroll && (
        <div className="mt-8 flex items-center justify-center gap-6">
          {[
            { kierunek: -1 as const, label: t("carouselPrev"), path: "M10 3L5 8l5 5", disabled: atStart },
            { kierunek: 1 as const, label: t("carouselNext"), path: "M6 3l5 5-5 5", disabled: atEnd },
          ].map(({ kierunek, label: etykieta, path, disabled }) => (
            <button
              key={etykieta}
              type="button"
              onClick={() => przesun(kierunek)}
              aria-label={etykieta}
              disabled={disabled}
              className="flex h-9 w-9 items-center justify-center border border-[var(--color-control-border)] text-[var(--foreground)] transition-colors hover:border-[var(--foreground)] disabled:opacity-30 disabled:hover:border-[var(--color-control-border)]"
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
      )}
    </div>
  );
}

// Szerokość jednego kafelka w karuzeli: dwa na telefonie, trzy od 768 px,
// cztery od 1024 px — dokładnie tak, jak w siatce sklepu. Odstęp to gap-6
// (24 px), stąd odejmowania: przy n kolumnach kafelek ma (100% − (n−1)·24)/n.
export const CAROUSEL_ITEM_CLASS =
  "w-[calc(50%-12px)] shrink-0 snap-start md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]";
