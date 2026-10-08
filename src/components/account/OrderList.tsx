import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { OrderPaymentState, OrderProps } from "@/contracts/server/order";
import { formatPrice } from "@/lib/helpers/currency";
import { formatDeadline } from "@/lib/helpers/date";
import { countPieces } from "@/lib/helpers/order";
import { ButtonArrow, buttonClass } from "@/components/ui/button";

const STATUS_TONE: Record<string, string> = {
  completed: "var(--color-success)",
  processing: "var(--color-info)",
  pending: "var(--muted)",
  "on-hold": "var(--color-warning)",
  cancelled: "var(--color-error)",
  refunded: "var(--muted)",
  failed: "var(--color-error)",
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
              {/* Bank potwierdza płatność (Klarna) — ten sam stan WooCommerce
                  co „złożone, czeka na wpłatę", ale klient ma zobaczyć różnicę. */}
              {order.paymentState === OrderPaymentState.AwaitingConfirmation
                ? t("orderStatus.awaitingConfirmation")
                : t(`orderStatus.${order.status}`)}
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
                  {formatPrice(item.total, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between border-t border-[var(--border)] pt-3 text-sm">
            <span className="tracking-widest uppercase text-xs text-[var(--muted)]">
              {t("orders.total")}
            </span>
            <span className="font-medium">
              {formatPrice(order.total, order.currency)}
            </span>
          </div>

          {/* Zamówienie czekające na pieniądze dostaje drogę do ich wpłacenia
              — na stronę zamówienia, tę samą co w mailu (z terminem
              rezerwacji i z anulowaniem). */}
          {order.payable && (
            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-3">
              <p className="text-xs text-[var(--muted)]">
                {order.reservedUntil
                  ? t("orders.reservedUntil", {
                      deadline: formatDeadline(order.reservedUntil, locale),
                      count: countPieces(order.items),
                    })
                  : t("orders.awaitingPayment")}
              </p>
              <Link
                href={{
                  pathname: "/order",
                  query: { id: order.id, key: order.key },
                }}
                className={buttonClass()}
              >
                {t("orders.payNow")}
                <ButtonArrow />
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
