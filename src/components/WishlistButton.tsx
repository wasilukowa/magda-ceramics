"use client";

import { useTranslations } from "next-intl";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

export default function WishlistButton({
  productId,
  productName,
  className,
  withLabel = false,
}: {
  productId: number;
  // Nazwa produktu trafia do etykiety dla czytnika ekranu. Na stronie produktu
  // jest zbędna (jest nagłówek), ale w siatce dwadzieścia serc mówiących samo
  // „Dodaj do ulubionych" nie mówi nic — nie wiadomo, przy czym się stoi.
  // Etykieta ma postać „Dodaj do ulubionych: {nazwa}", bez cudzysłowu wokół
  // nazwy: połowa kubków ma cudzysłów już w samej nazwie („Kubek „Kakao"").
  productName?: string;
  className?: string;
  withLabel?: boolean;
}) {
  const t = useTranslations("wishlist");
  const { isInWishlist, toggle } = useWishlist();
  const active = isInWishlist(productId);

  const label = productName
    ? t(active ? "removeNamed" : "addNamed", { name: productName })
    : t(active ? "remove" : "add");

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "flex items-center gap-2 transition-opacity hover:opacity-60",
        className,
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {withLabel && (
        <span className="text-xs tracking-widest uppercase">
          {active ? t("remove") : t("add")}
        </span>
      )}
    </button>
  );
}
