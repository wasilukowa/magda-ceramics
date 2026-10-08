import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentCustomer } from "@/lib/auth/dal";
import { orderService } from "@/lib/service/order";
import AccountLoading from "@/components/account/AccountLoading";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: `${t("pay.title")} — Magda Ceramics` };
}

// Zapłata za zamówienie odbywa się na stronie zamówienia (numer + klucz),
// tej samej, do której prowadzą linki z maili — z terminem rezerwacji
// i z anulowaniem. Ten adres zostaje dla starszych linków: po sprawdzeniu,
// że zamówienie należy do zalogowanego klienta, przenosi tam.
//
// Numer zamówienia idzie w adresie jako ?order=, a nie jako segment ścieżki.
// Segment dynamiczny bez `generateStaticParams` odbiera całej trasie statyczną
// skorupę — łącznie z nagłówkiem sklepu, który wtedy czeka na serwer.
async function PayRedirect({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderParam } = await searchParams;
  const orderId = Number(orderParam);
  const customer = await getCurrentCustomer();

  if (!customer || !Number.isInteger(orderId) || orderId <= 0) notFound();

  const order = await orderService.getCustomerOrder(customer.id, orderId);
  if (!order) notFound();

  return redirect({
    href: { pathname: "/order", query: { id: order.id, key: order.key } },
    locale,
  });
}

export default async function PayOrderPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await props.params;

  return (
    <Suspense fallback={<AccountLoading />}>
      <PayRedirect locale={locale} searchParams={props.searchParams} />
    </Suspense>
  );
}
