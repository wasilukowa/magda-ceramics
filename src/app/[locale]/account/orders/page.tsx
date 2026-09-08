import { getTranslations } from "next-intl/server";
import { getCurrentCustomer } from "@/lib/auth/dal";
import { orderService } from "@/lib/service/order";
import OrderList from "@/components/account/OrderList";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("nav.orders")} — Magda Ceramics` };
}

export default async function OrdersPage() {
  const t = await getTranslations("account");
  const customer = await getCurrentCustomer();
  const orders = customer ? await orderService.getCustomerOrders(customer.id) : [];

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-sm tracking-widest uppercase">{t("nav.orders")}</h2>
      <OrderList orders={orders} />
    </div>
  );
}
