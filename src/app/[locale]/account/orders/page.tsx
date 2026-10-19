import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentCustomer } from "@/lib/auth/dal";
import { orderService } from "@/lib/service/order";
import OrderList from "@/components/account/OrderList";
import AccountLoading from "@/components/account/AccountLoading";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("nav.orders")} — Magda Ceramics` };
}

async function Orders() {
  const [customer, locale] = await Promise.all([getCurrentCustomer(), getLocale()]);
  const orders = customer ? await orderService.getCustomerOrders(customer.id, locale) : [];
  return <OrderList orders={orders} />;
}

// Dane z WordPressa we własnej granicy <Suspense>, w samej stronie — tak jak
// w pozostałych zakładkach konta. Przy przejściu między zakładkami układ
// konta zostaje na ekranie, a jego granica szkieletu już nie pokazuje: bez
// tej strona stała na poprzedniej zakładce, dopóki WordPress nie odpowiedział
// (podpowiedź Next.js „uncached data during a navigation", 2026-10-19).
export default async function OrdersPage() {
  const t = await getTranslations("account");

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-sm tracking-widest uppercase">{t("nav.orders")}</h2>
      <Suspense fallback={<AccountLoading />}>
        <Orders />
      </Suspense>
    </div>
  );
}
