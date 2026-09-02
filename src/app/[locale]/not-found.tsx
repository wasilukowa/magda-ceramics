import NotFoundView from "@/components/NotFoundView";

// Granica dla `notFound()` rzuconego w tym segmencie — dziś woła je już tylko
// layout `[locale]`, gdy w adresie stoi nieznany język. Nieznane adresy i
// nieistniejące produkty rysują ten sam widok WPROST, bez `notFound()`;
// dlaczego — patrz `[locale]/[...rest]/page.tsx`.
export default function NotFound() {
  return <NotFoundView />;
}
