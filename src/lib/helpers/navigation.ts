import type { ComponentProps } from "react";
import type { Link } from "@/i18n/navigation";
import type { StaticRoute } from "@/content/types";

export type AppHref = ComponentProps<typeof Link>["href"];

// Treść, która sama decyduje, dokąd linkuje — regulamin, „Wysyłka i zwroty",
// FAQ — trzyma trasę jako UNIĘ wszystkich tras statycznych. Przy formie
// obiektowej (z kotwicą) next-intl chce jednej konkretnej trasy i unii nie
// przyjmuje; im więcej stron ma sklep, tym pewniej się o to potyka —
// dołożenie archiwum wystarczyło, żeby przestało się kompilować.
//
// Zawężenie siedzi w jednym miejscu, na własnym typie Linku (nie na `any`),
// żeby pliki z treścią mogły dalej trzymać adresy jako dane.
export const routeHref = (route: StaticRoute, hash?: string): AppHref =>
  (hash ? { pathname: route, hash } : route) as AppHref;
