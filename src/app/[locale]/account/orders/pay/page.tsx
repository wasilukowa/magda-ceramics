import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentCustomer } from "@/lib/auth/dal";
import { orderService } from "@/lib/service/order";
import { paymentService } from "@/lib/service/payment";
import OrderPayment from "@/components/account/OrderPayment";
import AccountLoading from "@/components/account/AccountLoading";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("pay.title")} — Magda Ceramics` };
}

// Numer zamówienia idzie w adresie jako ?order=, a nie jako segment ścieżki.
// Segment dynamiczny bez `generateStaticParams` odbiera całej trasie statyczną
// skorupę — łącznie z nagłówkiem sklepu, który wtedy czeka na serwer. Tak samo
// zrobiony jest sklep z filtrami.
async function PayContent({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderParam } = await searchParams;
  const orderId = Number(orderParam);
  const customer = await getCurrentCustomer();
  const t = await getTranslations("account");

  if (!customer || !Number.isInteger(orderId) || orderId <= 0) notFound();

  const order = await orderService.getCustomerOrder(customer.id, orderId);
  if (!order) notFound();

  // Zamówienie opłacone nie ma po co pokazywać formularza — i nie wolno mu
  // tworzyć drugiej płatności.
  if (!order.payable) {
    return (
      <p className="border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--muted)]">
        {t("pay.alreadyPaid")}
      </p>
    );
  }

  return (
    <OrderPayment
      order={order}
      clientSecret={await paymentService.createOrderIntent(order)}
    />
  );
}

export default async function PayOrderPage(props: {
  searchParams: Promise<{ order?: string }>;
}) {
  const t = await getTranslations("account");

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-sm tracking-widest uppercase">{t("pay.title")}</h2>
      <Suspense fallback={<AccountLoading />}>
        <PayContent {...props} />
      </Suspense>
    </div>
  );
}
