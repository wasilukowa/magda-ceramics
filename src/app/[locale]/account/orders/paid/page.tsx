import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import OrderConfirmation from "@/components/account/OrderConfirmation";
import AccountLoading from "@/components/account/AccountLoading";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("pay.paidTitle")} — Magda Ceramics` };
}

// Sama strona nic nie rozstrzyga: numer zamówienia i numer płatności czyta
// przeglądarka z adresu, a odpowiedzi udziela /api/orders/confirm — pyta
// Stripe'a i sprawdza w sesji, czy to zamówienie należy do tego klienta.
export default function OrderPaidPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <OrderConfirmation />
    </Suspense>
  );
}
