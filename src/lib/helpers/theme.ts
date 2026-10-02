import { Theme } from "@/contracts/shared";

// Pod tym kluczem pamięć przeglądarki trzyma wygląd wybrany przełącznikiem.
// Brak wpisu = klient niczego nie wybierał i obowiązuje ustawienie urządzenia.
export const THEME_STORAGE_KEY = "theme";

export const parseTheme = (raw: string | null): Theme | null =>
  raw === Theme.Light || raw === Theme.Dark ? raw : null;

// Skrypt wstawiany do <head>. Przeglądarka wykonuje go w trakcie czytania
// strony, zanim cokolwiek namaluje, więc ktoś, kto wybrał tryb ciemny, nie
// zobaczy przy wejściu błysku jasnej strony (wzorzec z dokumentacji Nexta,
// guides/preventing-flash-before-hydration). Strona zostaje statyczna:
// serwer nie musi znać wyboru klienta. Bez wpisu atrybut nie powstaje i decyduje
// ustawienie urządzenia (media query w globals.css).
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="${Theme.Light}"||t==="${Theme.Dark}")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
