"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ButtonSize, ButtonVariant } from "@/contracts/shared";
import { buttonClass } from "@/components/ui/button";

// Anulowanie złożonego, nieopłaconego zamówienia przez klienta. Zawsze z
// pytaniem „na pewno?" — także gdy klient przyszedł z przycisku „Anuluj"
// w mailu (`defaultOpen`): samo wejście w link niczego nie anuluje, bo
// programy pocztowe potrafią otwierać linki same.
export default function OrderCancel({
  orderId,
  orderKey,
  pieces,
  defaultOpen,
}: {
  orderId: number;
  orderKey: string;
  // Ile prac wróci do sklepu — „praca wróci" czy „prace wrócą".
  pieces: number;
  defaultOpen: boolean;
}) {
  const t = useTranslations("order.cancel");
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const ok = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, key: orderKey }),
    })
      .then((r) => r.ok)
      .catch(() => false);

    if (!ok) {
      setError(t("failed"));
      setLoading(false);
      return;
    }
    // Stan zamówienia (anulowane albo — gdyby pieniądze zdążyły dojść —
    // opłacone) pokaże strona na nowo, prosto z WooCommerce.
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass({ variant: ButtonVariant.Secondary, size: ButtonSize.Block })}
      >
        {t("button")}
      </button>
    );
  }

  return (
    <div className="border border-[var(--border)] px-5 py-5 flex flex-col gap-4">
      <p className="text-sm leading-relaxed">{t("question", { count: pieces })}</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className={buttonClass({ variant: ButtonVariant.Secondary, size: ButtonSize.Block })}
        >
          {t("keep")}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className={buttonClass({ size: ButtonSize.Block })}
        >
          {loading ? t("cancelling") : t("confirm")}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
