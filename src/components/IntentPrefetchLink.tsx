"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { IntentPrefetchLinkProps } from "@/contracts/shared";

// Link do strony produktu w siatkach kart (sklep, archiwum, polecane,
// ulubione, mapa strony). Domyślny <Link> wczytuje stronę z wyprzedzeniem,
// gdy tylko pojawi się na ekranie — więc jedna osoba przewijająca sklep
// pobierała w kilka minut strony kilkudziesięciu produktów, każdą 2–4 razy.
// Każde takie pobranie kopii starszej niż minuta (profil `catalog`) zleca
// w tle odświeżenie strony z WordPressa, a serwer WP łamie się powyżej
// ~10 zapytań naraz (reference-wp-hosting). ZMIERZONE 8.11: jeden gość =
// 56 produktów w 7 minut, i właśnie w takich minutach WordPress przestawał
// odpowiadać — także budzikowi rezerwacji (maile „Cronjob failed”).
//
// Dlatego strona produktu wczytuje się z wyprzedzeniem dopiero na sygnał
// zamiaru: najechanie myszą, dotknięcie palcem albo przejście klawiaturą.
// To wzorzec z dokumentacji Nexta (guides/prefetching, „Hover-triggered
// prefetch”), polecany właśnie dla siatek kart. Kliknięcie bez wcześniejszego
// sygnału też działa — strona przychodzi wtedy z pamięci Vercela, tylko bez
// tych kilkuset milisekund przewagi.
export default function IntentPrefetchLink({
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...props
}: IntentPrefetchLinkProps) {
  const [intent, setIntent] = useState(false);

  return (
    <Link
      {...props}
      // `null` przywraca zwykłe zachowanie Linka — link jest wtedy na
      // ekranie, więc Next od razu wczytuje stronę.
      prefetch={intent ? null : false}
      onMouseEnter={(event) => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
    />
  );
}
