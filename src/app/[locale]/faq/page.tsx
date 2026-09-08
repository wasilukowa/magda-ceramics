import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { FAQ } from "@/content/faq";
import { FaqEntry } from "@/content/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return buildPageMetadata({
    locale,
    route: "/faq",
    title: t("title"),
    description: t("metaDescription"),
  });
}

// Pytania czekające na odpowiedź Magdy (`draft`) nie trafiają na stronę —
// krótsze FAQ jest lepsze niż zmyślona odpowiedź.
const isAnswered = (entry: FaqEntry) => !entry.draft && entry.answer.length > 0;

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const groups =
    FAQ[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];
  const t = await getTranslations({ locale, namespace: "faq" });

  const answeredGroups = groups
    .map((group) => ({ ...group, entries: group.entries.filter(isAnswered) }))
    .filter((group) => group.entries.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-4 text-center">
        {t("title")}
      </h1>
      <p className="text-sm text-[var(--muted)] text-center mb-16">
        {t("intro")}
      </p>

      <div className="flex flex-col gap-14">
        {answeredGroups.map((group) => (
          <section key={group.heading}>
            <h2 className="text-xs tracking-widest uppercase mb-6">
              {group.heading}
            </h2>

            {/* Zwykłe <details> — rozwijanie działa bez jednej linijki
                JavaScriptu, także zanim strona się nawodni, a czytniki ekranu
                znają ten element od zawsze. */}
            <ul className="border-t border-[var(--border)]">
              {group.entries.map((entry) => (
                <li key={entry.question} className="border-b border-[var(--border)]">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-sm marker:content-none [&::-webkit-details-marker]:hidden">
                      {entry.question}
                      <span
                        aria-hidden
                        className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>

                    <div className="pb-5 flex flex-col gap-3">
                      {entry.answer.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-sm leading-relaxed text-[var(--muted)]"
                        >
                          {paragraph}
                        </p>
                      ))}

                      {entry.moreRoute && (
                        <Link
                          href={
                            entry.moreHash
                              ? { pathname: entry.moreRoute, hash: entry.moreHash }
                              : entry.moreRoute
                          }
                          className="text-xs tracking-widest uppercase hover:text-[var(--foreground)] text-[var(--muted)] transition-colors"
                        >
                          {t("more")}
                        </Link>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 border-t border-[var(--border)] pt-10 text-sm text-[var(--muted)] text-center">
        {t.rich("stillStuck", {
          link: (chunks) => (
            <Link href="/contact" className="underline hover:text-[var(--foreground)]">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
