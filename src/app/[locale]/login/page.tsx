import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { unstable_rethrow } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getCurrentCustomer, getSession } from "@/lib/auth/dal";
import LoginForm from "@/components/auth/LoginForm";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("login.title")} — Magda Ceramics` };
}

// Formularz razem z bramką „zalogowany idzie dalej". Oba czytają dane żądania —
// adres powrotu z ?redirect= i ciasteczko sesji — więc stoją we wspólnej
// granicy <Suspense>. Nagłówek strony zostaje w statycznej skorupie.
async function LoginContent({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;
  // Only honour internal paths so the redirect can't be used to bounce the
  // customer off-site after they log in.
  const redirectTo =
    redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/account";

  // Dalej idzie tylko ten, czyje konto naprawdę istnieje — sama sesja nie
  // wystarcza. Konto usunięte w WordPressie zostawia ważne ciasteczko, panel
  // konta odsyła takiego gościa tutaj, a odesłanie go z powrotem kręciło
  // przeglądarką w kółko. Gdy WordPress nie odpowiada, też zostaje formularz.
  if (await getSession()) {
    let customer = null;
    try {
      customer = await getCurrentCustomer();
    } catch (error) {
      unstable_rethrow(error);
      console.error("Login page: customer lookup failed:", error);
    }
    if (customer)
      redirect({
        href: redirectTo as Parameters<typeof redirect>[0]["href"],
        locale,
      });
  }

  return <LoginForm redirectTo={redirectTo} />;
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("auth");

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("login.title")}
      </h1>
      <Suspense fallback={null}>
        <LoginContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
