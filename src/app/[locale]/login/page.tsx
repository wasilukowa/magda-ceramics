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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (session) redirect({ href: "/account", locale });

  const t = await getTranslations("auth");

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("login.title")}
      </h1>
      <LoginForm />
    </div>
  );
}
