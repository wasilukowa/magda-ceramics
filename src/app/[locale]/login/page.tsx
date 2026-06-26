import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/dal";
import LoginForm from "@/components/auth/LoginForm";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("login.title")} — Magda Ceramics` };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectParam } = await searchParams;
  // Only honour internal paths so the redirect can't be used to bounce the
  // customer off-site after they log in.
  const redirectTo =
    redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/account";

  const session = await getSession();
  if (session)
    redirect({
      href: redirectTo as Parameters<typeof redirect>[0]["href"],
      locale,
    });

  const t = await getTranslations("auth");

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("login.title")}
      </h1>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
