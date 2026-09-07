import { getTranslations } from "next-intl/server";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("forgot.title")} — Magda Ceramics`, robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("forgot.title")}
      </h1>
      <ForgotPasswordForm />
    </div>
  );
}
