import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/helpers/metadata";
import { REVIEWS, REVIEWS_SOURCE_URL } from "@/content/reviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reviews" });
  // `intro` ma w sobie {count} — bez podanej liczby next-intl rzuca
  // FORMATTING_ERROR już na etapie metadanych, a strona i tak się renderuje,
  // więc widać to wyłącznie w konsoli.
  return buildPageMetadata({
    locale,
    route: "/reviews",
    title: t("title"),
    description: t("intro", { count: REVIEWS.length }),
  });
}

// Wszystkie opinie, jedna pod drugą. Slidery na stronie głównej i „O mnie"
// pokazują wybraną dziesiątkę — tutaj jest komplet, żeby dało się przeczytać
// wszystko i podlinkować komuś konkretny adres.
export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reviews" });

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-6 text-center">
        {t("title")}
      </h1>

      {/* Nota o źródle jest tu wpleciona w zdanie wstępne — powtarzanie jej
          osobno, tak jak pod sliderem, brzmiałoby dwa razy to samo. */}
      <p className="text-sm text-[var(--muted)] leading-relaxed text-center max-w-xl mx-auto mb-16">
        {t("intro", { count: REVIEWS.length })}{" "}
        <a
          href={REVIEWS_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--foreground)] underline"
        >
          {t("sourceLink")}
        </a>
      </p>

      <ul className="space-y-10">
        {REVIEWS.map((review, index) => (
          <li
            key={`${review.author}-${index}`}
            className="border-b border-[var(--border)] pb-10 last:border-b-0"
          >
            <blockquote className="space-y-3">
              <span
                className="flex gap-1 text-[var(--color-rating)]"
                role="img"
                aria-label={t("rating", { rating: review.rating })}
              >
                {Array.from({ length: 5 }).map((_, star) => (
                  <svg
                    key={star}
                    width="12"
                    height="12"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    fill={star < review.rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
                  </svg>
                ))}
              </span>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{review.text}</p>
              <footer className="text-[10px] tracking-[0.25em] uppercase text-[var(--muted)]">
                {review.author}
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}
