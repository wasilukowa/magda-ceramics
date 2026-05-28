import { getTranslations } from "next-intl/server";

export default async function ComingSoonPage() {
  const t = await getTranslations("comingSoon");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4">
        {t("title")}
      </h1>
      <p className="text-sm text-[var(--muted)]">{t("message")}</p>
    </div>
  );
}
