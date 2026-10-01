"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { getUnitPrice, formatPrice } from "@/lib/helpers/currency";

type Props = {
  price: string;
  className?: string;
};

// Renders a single product price in the currently selected currency.
export default function Price({ price, className }: Props) {
  const { currency } = useCurrency();
  return (
    <span className={className}>
      {formatPrice(getUnitPrice({ price }, currency), currency)}
    </span>
  );
}
