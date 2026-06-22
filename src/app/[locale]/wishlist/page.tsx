import { getTranslations } from "next-intl/server";
import WishlistGrid from "@/components/WishlistGrid";

export async function generateMetadata() {
  const t = await getTranslations("wishlist");
  return { title: `${t("title")} — Magda Ceramics` };
}

export default async function WishlistPage() {
  const t = await getTranslations("wishlist");

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("title")}
      </h1>
      <WishlistGrid />
    </div>
  );
}
