import { useTranslations } from "next-intl";
import { OrderProps } from "@/contracts/server/order";
import { formatPrice } from "@/lib/helpers/currency";

// Co jest w zamówieniu i ile kosztuje — w walucie, w której klient zamawiał.
export default function OrderItems({ order }: { order: OrderProps }) {
  const t = useTranslations("order");

  return (
    <div className="border border-[var(--border)] px-5 py-4 flex flex-col gap-3">
      <ul className="text-sm text-[var(--muted)] flex flex-col gap-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span>
              {item.name}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </span>
            <span className="whitespace-nowrap">
              {formatPrice(item.total, order.currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-[var(--border)] pt-3 text-sm">
        <span className="text-xs tracking-widest uppercase text-[var(--muted)]">
          {t("total")}
        </span>
        <span className="font-medium">{formatPrice(order.total, order.currency)}</span>
      </div>
    </div>
  );
}
