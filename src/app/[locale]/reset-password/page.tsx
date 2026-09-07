import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { verifyPasswordResetToken } from "@/lib/auth/resetToken";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("reset.title")} — Magda Ceramics`, robots: { index: false } };
}

// Token siedzi w adresie, czyli w danych żądania — dlatego ta część stoi we
// własnej granicy <Suspense>, a nagłówek strony zostaje w statycznej skorupie.
//
// Sprawdzamy tu tylko podpis i termin ważności (bez pytania WooCommerce), żeby
// od razu powiedzieć „link wygasł" zamiast pokazywać formularz, który i tak nie
// zadziała. To, czy z linku już skorzystano, weryfikuje dopiero akcja.
async function ResetContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getTranslations("auth");

  if (!verifyPasswordResetToken(token)) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="text-sm leading-relaxed">{t("reset.invalidLink")}</p>
        <p>
          <Link
            href="/forgot-password"
            className="inline-block text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
          >
            {t("reset.requestAgain")}
          </Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm token={token as string} />;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getTranslations("auth");

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("reset.title")}
      </h1>
      <Suspense fallback={null}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
