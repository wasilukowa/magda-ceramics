"use client";

import { InlineScriptProps } from "@/contracts/shared";

// Skrypt, który ma się wykonać tylko przy wejściu na stronę (np. wygląd
// z pamięci przeglądarki, zanim cokolwiek się namaluje). Przy przejściu
// między stronami — także przy zmianie języka, bo wtedy od nowa renderuje
// się cały układ z <html> — React buduje <script> sam, a takiego przeglądarka
// nigdy nie wykonuje, więc React ostrzega („Encountered a script tag…”).
// Wzorzec z dokumentacji Nexta (guides/preventing-flash-before-hydration):
// serwer wysyła zwykły skrypt, a w przeglądarce ten sam znacznik dostaje
// type="text/plain", czyli jest tylko tekstem. Musi to być komponent
// kliencki — w komponencie serwerowym `window` nie istnieje nigdy i znacznik
// zawsze byłby skryptem. `suppressHydrationWarning`: różnica w `type` między
// serwerem a przeglądarką jest zamierzona.
export default function InlineScript({ html }: InlineScriptProps) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
