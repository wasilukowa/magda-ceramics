import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import { orderService } from "@/lib/service/order";
import { checkoutService } from "@/lib/service/checkout";
import { OrderPaymentState, OrderProps } from "@/contracts/server/order";
import { formatDeadline } from "@/lib/helpers/date";
import { countPieces } from "@/lib/helpers/order";
import { SITE_NAME } from "@/lib/helpers/metadata";
import { ButtonArrow, buttonClass } from "@/components/ui/button";
import OrderItems from "@/components/order/OrderItems";
import OrderPayment from "@/components/order/OrderPayment";
import OrderCancel from "@/components/order/OrderCancel";
import OrderLoading from "@/components/order/OrderLoading";

type OrderSearchParams = Promise<{
  id?: string;
  key?: string;
  // Płatność z kasy nie przeszła — klient przyszedł spróbować jeszcze raz.
  retry?: string;
  // Klient kliknął „Anuluj zamówienie" w mailu.
  cancel?: string;
  // Stripe po zapłacie odsyła tu z numerem płatności.
  payment_intent?: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order" });
  return { title: `${t("title")} — ${SITE_NAME}`, robots: { index: false } };
}

const NOTICE_CLASS =
  "border border-[var(--border)] px-6 py-8 text-sm leading-relaxed text-center";

// Adres tej strony dla zamówienia — tu Stripe odsyła klienta po zapłacie.
const getReturnPath = (locale: string, order: OrderProps): string =>
  `${getPathname({ locale, href: "/order" })}?${new URLSearchParams({
    id: order.id.toString(),
    key: order.key,
  })}`;

// Numer i klucz zamówienia idą w adresie jako ?id=&key=, a nie jako segment
// ścieżki — segment dynamiczny bez `generateStaticParams` odebrałby całej
// trasie statyczną skorupę (tak samo zrobione jest „Zapłać" w koncie i sklep
// z filtrami).
async function OrderContent({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: OrderSearchParams;
}) {
  const { id, key, retry, cancel, payment_intent: paymentIntent } = await searchParams;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0 || !key) notFound();

  const order = await orderService.getOrderByKey(orderId, key);
  if (!order) notFound();

  const t = await getTranslations({ locale, namespace: "order" });
  const state = paymentIntent
    ? await checkoutService.getStateAfterReturn(order, paymentIntent)
    : order.paymentState;

  const heading = (
    <p className="text-sm font-medium">{t("number", { number: order.number })}</p>
  );
  const backToShop = (
    <Link href="/shop" className={buttonClass()}>
      {t("backToShop")}
      <ButtonArrow />
    </Link>
  );

  if (state !== OrderPaymentState.Unpaid) {
    const message = {
      [OrderPaymentState.Paid]: t("paid"),
      [OrderPaymentState.AwaitingConfirmation]: t("awaitingConfirmation"),
      [OrderPaymentState.Cancelled]: t("cancelled"),
      [OrderPaymentState.Refunded]: t("refunded"),
    }[state];

    return (
      <div className="flex flex-col gap-8">
        {heading}
        <p className={NOTICE_CLASS}>{message}</p>
        <OrderItems order={order} />
        <div className="text-center">{backToShop}</div>
      </div>
    );
  }

  // Płatność, która właśnie nie przeszła — z kasy (retry) albo stąd (Stripe
  // odesłał tu z numerem płatności, a zamówienie dalej czeka).
  const failed = retry === "1" || Boolean(paymentIntent);
  const clientSecret = await checkoutService.getOrderPayment(order);

  return (
    <div className="flex flex-col gap-8">
      {heading}
      {failed && (
        <p className="text-sm text-[var(--color-error)] leading-relaxed">{t("retry")}</p>
      )}
      {order.reservedUntil && (
        <p className="text-sm leading-relaxed">
          {t("reservedUntil", {
            deadline: formatDeadline(order.reservedUntil, locale),
            count: countPieces(order.items),
          })}
        </p>
      )}
      <OrderItems order={order} />
      <OrderPayment
        order={order}
        clientSecret={clientSecret}
        returnPath={getReturnPath(locale, order)}
      />
      <OrderCancel
        orderId={order.id}
        orderKey={order.key}
        pieces={countPieces(order.items)}
        defaultOpen={cancel === "1"}
      />
    </div>
  );
}

// Strona jednego zamówienia, otwierana z linku w mailu — bez logowania, po
// numerze i kluczu zamówienia. Złożone, nieopłacone zamówienie da się tu
// opłacić albo anulować; każde inne pokazuje, jak z nim jest.
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: OrderSearchParams;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order" });

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <h1 className="text-xs tracking-widest uppercase mb-12">{t("title")}</h1>
      <Suspense fallback={<OrderLoading />}>
        <OrderContent locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
