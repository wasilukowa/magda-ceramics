import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { COOKIE_REGISTRY } from "@/content/data";
import { CookieSettings } from "@/components/cookies/CookieSettings";

export async function generateMetadata() {
  const t = await getTranslations("cookies");
  return { title: `${t("pageTitle")} — Magda Ceramics` };
}

export default async function CookiesPage() {
  const t = await getTranslations("cookies");

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("pageTitle")}
      </h1>

      <div className="space-y-8 text-sm text-[var(--muted)] leading-relaxed">
        <section className="space-y-3">
          <p>{t("intro")}</p>
          <p>{t("legalBasis")}</p>
        </section>

        <section>
          <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">
            {t("tableTitle")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="py-3 pr-4 font-normal tracking-widest uppercase text-[10px]">
                    {t("tableName")}
                  </th>
                  <th className="py-3 pr-4 font-normal tracking-widest uppercase text-[10px]">
                    {t("tableProvider")}
                  </th>
                  <th className="py-3 pr-4 font-normal tracking-widest uppercase text-[10px]">
                    {t("tablePurpose")}
                  </th>
                  <th className="py-3 font-normal tracking-widest uppercase text-[10px]">
                    {t("tableDuration")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_REGISTRY.map((entry) => (
                  <tr key={entry.key} className="border-b border-[var(--border)]">
                    <td className="py-3 pr-4 align-top text-[var(--foreground)] whitespace-nowrap">
                      {entry.name}
                    </td>
                    <td className="py-3 pr-4 align-top">{entry.provider}</td>
                    <td className="py-3 pr-4 align-top">
                      {t(`entries.${entry.key}.purpose`)}
                      <span className="block mt-1 text-[10px] tracking-widest uppercase opacity-70">
                        {t(`categories.${entry.category}.label`)}
                      </span>
                    </td>
                    <td className="py-3 align-top">
                      {t(`entries.${entry.key}.duration`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs">{t("noTrackingNote")}</p>
        </section>

        <section id="settings" className="scroll-mt-8">
          <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">
            {t("settingsTitle")}
          </h2>
          <p className="mb-2">{t("settingsIntro")}</p>
          <CookieSettings />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">
            {t("browserTitle")}
          </h2>
          <p>{t("browserNote")}</p>
          <p>
            {t("privacyNote")}{" "}
            <Link href="/privacy" className="text-[var(--foreground)] underline">
              {t("privacyLink")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
