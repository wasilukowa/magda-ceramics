import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import RedirectIfLoggedIn from "@/components/auth/RedirectIfLoggedIn";
import RegisterForm from "@/components/auth/RegisterForm";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("register.title")} — Magda Ceramics` };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth");

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("register.title")}
      </h1>
      <Suspense fallback={null}>
        <RedirectIfLoggedIn locale={locale} href="/account" />
      </Suspense>
      <RegisterForm />
    </div>
  );
}
