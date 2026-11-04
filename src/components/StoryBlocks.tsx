import Image from "next/image";
import { cn } from "@/lib/utils";
import { StoryBlock } from "@/content/types";

// Tekst i zdjęcia z dokumentów Magdy („O mnie", „Moja ceramika") w tej
// kolejności, w której je ułożyła.
//
// Szerokość zdjęć zależy od tego, ile ich stoi w grupie. Pojedyncze (portret,
// znak na spodzie) zajmują całą kolumnę tekstu, para staje obok siebie,
// a większa grupa (etapy pracy) układa się w dwie kolumny — przy trzech
// kafelki wychodziły po 200 px i drobne szczegóły ginęły. Od 2026-10-02
// wszystkie zdjęcia to oryginały od Magdy (1600 px), więc mają z czego się
// rozciągnąć.
const photoGroupLayout = (count: number) =>
  count === 1 ? "" : "grid grid-cols-2 gap-3";

// Podpowiedź dla przeglądarki, jakiej szerokości zdjęcie pobrać: kolumna
// tekstu ma najwyżej 624 px (max-w-2xl minus odstępy po bokach).
const photoSizes = (count: number) =>
  count === 1 ? "(max-width: 672px) 100vw, 624px" : "(max-width: 672px) 50vw, 312px";

export const StoryBlocks = ({ blocks }: { blocks: StoryBlock[] }) =>
  blocks.map((block, index) => {
    if (block.type === "heading") {
      return (
        <h2
          key={`${block.type}-${index}`}
          className="text-xs tracking-[0.2em] uppercase text-[var(--foreground)] pt-4"
        >
          {block.text}
        </h2>
      );
    }

    if (block.type === "photos") {
      return (
        <div
          key={`${block.type}-${index}`}
          className={cn("py-2", photoGroupLayout(block.photos.length))}
        >
          {block.photos.map((photo) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes={photoSizes(block.photos.length)}
              // Samotne zdjęcie zachowuje własne proporcje — pierwszy portret
              // Magdy był pionowy i kadrowanie do kwadratu ucinało jej głowę.
              // W siatce równy kwadrat wygrywa z proporcjami, bo inaczej
              // wiersz rozjeżdża się o kilka pikseli.
              className={cn(
                "w-full rounded-sm",
                block.photos.length === 1 ? "h-auto" : "aspect-square object-cover",
              )}
            />
          ))}
        </div>
      );
    }

    return <p key={`${block.type}-${index}`}>{block.text}</p>;
  });
