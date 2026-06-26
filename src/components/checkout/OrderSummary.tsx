import { useTranslations } from "next-intl";
import { CartItem } from "@/contracts/server/cart";
import { Currency } from "@/contracts/shared";
import { getUnitPrice, formatPrice } from "@/lib/helpers/currency";

type Props = {
  items: CartItem[];
  currency: Currency;
  shippingCost: number;
  grandTotal: number;
  // Human label for the chosen delivery (e.g. "Paczkomat InPost" / "Kurier"),
  // shown under the shipping line.
  deliveryLabel: string;
  // Optional call-to-action area (step navigation / pay button) rendered at the
  // bottom of the panel.
  footer?: React.ReactNode;
};

// Floating order summary. Sticks just below the (sticky) navbar while the rest
// of the checkout scrolls, and carries the primary call-to-action.
export default function OrderSummary({
  items,
  currency,
  shippingCost,
  grandTotal,
  deliveryLabel,
  footer,
}: Props) {
  const t = useTranslations("checkout");

  return (
    <div className="lg:sticky lg:top-[180px] lg:self-start bg-[var(--color-surface)] p-6">
      <p className="text-xs tracking-widest uppercase mb-6">{t("summary")}</p>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">
              {item.name}{" "}
              {item.quantity > 1 && (
                <span className="text-xs">× {item.quantity}</span>
              )}
            </span>
            <span>
              {formatPrice(
                getUnitPrice(item, currency) * item.quantity,
                currency
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)] pt-4 space-y-3">
        <div className="flex justify-between items-start text-sm">
          <span>
            <span className="text-[var(--muted)]">{t("shipping")}</span>
            <span className="block text-xs text-[var(--muted)] mt-0.5">
              {deliveryLabel}
            </span>
          </span>
          <span>{formatPrice(shippingCost, currency)}</span>
        </div>

        <div className="flex justify-between items-baseline border-t border-[var(--border)] pt-3">
          <span className="text-sm font-semibold tracking-widest uppercase">
            {t("total")}
          </span>
          <span className="text-lg font-semibold">
            {formatPrice(grandTotal, currency)}
          </span>
        </div>
      </div>

      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}
