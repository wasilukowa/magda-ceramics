import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return { title: `${t("title")} — Magda Ceramics`, robots: { index: false } };
}

// Everything under /[locale] that matches no real route ends up here, so an
// unknown address gets the branded 404 (and a real 404 status) instead of the
// bare Next.js page.
export default function CatchAllPage() {
  return notFound();
}
