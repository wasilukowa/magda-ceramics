import { redirect } from "@/i18n/navigation";

// Konto zaczyna się od zamówień — osobny „Przegląd" zniknął (decyzja Natalii
// 2026-10-19). Adres „/konto" zostaje, bo prowadzą na niego ludzik
// w nagłówku, logowanie i stare linki.
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/account/orders", locale });
}
