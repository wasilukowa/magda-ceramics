import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ProductCardProps } from "@/contracts/shared";
import Price from "@/components/Price";
import WishlistButton from "@/components/WishlistButton";

// Ile kart z początku siatki ładuje zdjęcie od razu. Cztery, bo tyle stoi
// w pierwszym rzędzie na komputerze — a na telefonie (dwie kolumny) to dwa
// rzędy, czyli też mniej więcej pierwszy ekran.
export const EAGER_CARDS = 4;

// Zdjęcie karty jest responsywne (`w-full h-full`), więc bez `sizes` przeglądarka
// zakłada, że zajmie CAŁĄ szerokość ekranu, i ściąga najcięższy plik z listy.
// Wartości policzone z rzeczywistej siatki: kontener ma px-6 (2 × 24 px),
// odstępy między kartami to 24 px, kolumn jest 2 / 3 / 4, a najszerszy
// kontener zatrzymuje się na 1200 px. Stąd 270 px na dużym ekranie i odjęcia
// w `calc` niżej — sam „50vw" na telefonie zamawiałby plik 640 px tam, gdzie
// wystarczy 384 px.
// ‼️ Te liczby nie mogą być ZANIŻONE: przeglądarka wzięłaby wtedy plik mniejszy
// niż kafelek i zdjęcie byłoby rozmyte. Lepiej zaokrąglać w górę.
const CARD_IMAGE_SIZES =
  "(min-width: 1224px) 270px, (min-width: 1024px) calc(25vw - 30px), (min-width: 768px) calc(33.33vw - 32px), calc(50vw - 36px)";

export default function ProductCard({ product, soldOutLabel, eager }: ProductCardProps) {
  const image = product.images[0];
  const showSoldOut = !product.inStock && !!soldOutLabel;

  return (
    // Serce MUSI stać poza linkiem, nie w nim: przycisk w środku odnośnika to
    // niepoprawny HTML, a kliknięcie w serce otwierałoby przy okazji produkt.
    // Stąd wspólny kontener z `relative` i serce nałożone na róg zdjęcia.
    <div className="relative">
      <Link
        href={{ pathname: "/product/[slug]", params: { slug: product.slug } }}
        className="group block"
      >
        <div className="relative aspect-square bg-[var(--color-ceramic)] overflow-hidden mb-3">
          {/* Produkt bez zdjęcia zostawia sam ceramiczny kafelek — wrapper ma
              już to tło. Wcześniej stał tu angielski napis „No image": nieprze-
              tłumaczony, więc widoczny tak samo na polskiej stronie, i ledwo
              czytelny na tym tle (kontrast 4,07:1). */}
          {image && (
            <Image
              src={image.src}
              alt={image.alt || product.name}
              width={400}
              height={400}
              sizes={CARD_IMAGE_SIZES}
              // Zdjęcia z pierwszego ekranu nie czekają na przewinięcie —
              // inaczej sklep otwiera się jako plansza pustych kafelków, a
              // kubki wchodzą sekundę później.
              // ‼️ NIE `preload` (następca przestarzałego `priority`) i NIE
              // `fetchPriority="high"`. Dokumentacja Next 16 odradza preload
              // tam, gdzie największym elementem strony może być KTÓREKOLWIEK
              // z kilku zdjęć — a w siatce zależy to od szerokości okna.
              // SPRAWDZONE NA WYGENEROWANYM HTML-u: przy `eager` Next i tak
              // wstawia do nagłówka `<link rel=preload>` dla tych czterech
              // zdjęć i nie da się tego wyłączyć. Różnica jest w priorytecie:
              // bez `fetchPriority` te wpisy nie wyprzedzają arkusza stylów
              // ani krojów pisma — i dlatego go tu nie ma.
              loading={eager ? "eager" : "lazy"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}

          {/* Pasek u dołu zdjęcia, a nie w rogu — róg jest zajęty przez
              serduszko. Nie przykrywa zdjęcia, tylko jego skrawek. */}
          {showSoldOut && (
            <span className="absolute inset-x-0 bottom-0 bg-[var(--background)]/90 py-2 text-center text-[10px] tracking-[0.2em] uppercase text-[var(--foreground)]">
              {soldOutLabel}
            </span>
          )}
        </div>
        <p className="text-xs tracking-widest uppercase text-[var(--foreground)]">{product.name}</p>
        <Price
          price={product.price}
          priceEur={product.priceEur}
          className="block text-sm text-[var(--muted)] mt-1"
        />
      </Link>

      {/* Widoczne od razu, nie dopiero po najechaniu — na telefonie nie ma
          czym najechać, a to właśnie tam najczęściej się przegląda. Krążek tła
          jest po to, żeby serce dało się zobaczyć nad każdym zdjęciem, jasnym
          i ciemnym. Odstęp p-3 przy ikonie 20 px daje 44 px pola dotyku, czyli
          tyle, ile trzeba pod palec. */}
      <WishlistButton
        productId={product.id}
        productName={product.name}
        className="absolute top-2 right-2 z-10 rounded-full bg-[var(--background)]/80 p-3 text-[var(--foreground)]"
      />
    </div>
  );
}
