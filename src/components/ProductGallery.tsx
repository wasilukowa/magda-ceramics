"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  images: { src: string; alt: string }[];
  productName: string;
};

export default function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-[#e8e0d5] flex items-center justify-center text-[var(--muted)] text-xs tracking-widest uppercase">
        Brak zdjęcia
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-[#e8e0d5] overflow-hidden">
        <Image
          src={images[active].src}
          alt={images[active].alt || productName}
          width={800}
          height={800}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Zdjęcie ${i + 1}`}
              style={active === i ? { outline: "1px solid var(--foreground)" } : undefined}
              className={`aspect-square bg-[#e8e0d5] overflow-hidden transition-opacity ${
                active === i ? "" : "opacity-40 hover:opacity-80"
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt || productName}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
