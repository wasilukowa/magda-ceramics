import { useTranslations } from "next-intl";
import { OrderProps } from "@/contracts/server/order";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { formatPrice } from "@/lib/helpers/currency";

// Wiersz „Wysyłka" pod pracami w zamówieniu — bez niego prace i „Razem" się
// nie sumowały (uwaga Natalii 2026-10-19). Nazwy jak w podsumowaniu kasy.
export default function OrderShippingLine({ order }: { order: OrderProps }) {
  const t = useTranslations("checkout");

  return (
    <li className="flex justify-between gap-4">
      <span>
        {t("shipping")} —{" "}
        {order.deliveryMethod === DeliveryMethod.Locker
          ? t("summaryDeliveryLocker")
          : t("summaryDeliveryCourier")}
      </span>
      <span className="whitespace-nowrap">{formatPrice(order.shipping, order.currency)}</span>
    </li>
  );
}
