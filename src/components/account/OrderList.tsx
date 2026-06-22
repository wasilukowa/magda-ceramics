import { getTranslations, getLocale } from "next-intl/server";
import { OrderProps } from "@/contracts/server/order";

const STATUS_TONE: Record<string, string> = {
  completed: "var(--color-success,#2e7d32)",
  processing: "var(--color-info,#1565c0)",
  pending: "var(--muted)",
  "on-hold": "var(--color-warning,#b26a00)",
  cancelled: "var(--color-error,#b00020)",
  refunded: "var(--muted)",
  failed: "var(--color-error,#b00020)",
};

export default async function OrderList({ orders }: { orders: OrderProps[] }) {
  const t = await getTranslations("account");
  const locale = await getLocale();

  if (orders.length === 0) {
    return (
      <p className="border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--muted)]">
        {t("orders.empty")}
      </p>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li
          key={order.id}
          className="border border-[var(--border)] px-5 py-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-medium">
                {t("orders.number", { number: order.number })}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {dateFormatter.format(new Date(order.dateCreated))}
              </p>
            </div>
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{ color: STATUS_TONE[order.status] ?? "var(--muted)" }}
            >
              {t(`orderStatus.${order.status}`)}
            </span>
          </div>

          <ul className="text-sm text-[var(--muted)] flex flex-col gap-1">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.name}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="whitespace-nowrap">
                  {item.total} {order.currency}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between border-t border-[var(--border)] pt-3 text-sm">
            <span className="tracking-widest uppercase text-xs text-[var(--muted)]">
              {t("orders.total")}
            </span>
            <span className="font-medium">
              {order.total} {order.currency}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
