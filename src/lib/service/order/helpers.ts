import {
  OrderForPayment,
  OrderProps,
  OrderStatus,
  PAYABLE_STATUSES,
  RawOrder,
  RawOrderRefund,
  SalesOrder,
  UnpaidOrder,
} from "@/contracts/server/order";
import { LedgerAmount } from "@/contracts/server/exchangeRate";
import { routing } from "@/i18n/routing";
import { formatDayPl, getWarsawDay, parseWooGmtDate } from "@/lib/helpers/date";
import { formatPlNumber } from "@/lib/helpers/ledger";

// Meta, którym zaznaczamy wysłane przypomnienie o zapłacie. Dzięki temu drugi
// przebieg zadania nie napisze do tej samej osoby po raz drugi.
export const REMINDER_SENT_META_KEY = "_mc_payment_reminder_sent";

export const toOrderStatus = (status: string): OrderStatus =>
  Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : OrderStatus.Pending;

export const isPayableStatus = (status: OrderStatus): boolean =>
  PAYABLE_STATUSES.includes(status as (typeof PAYABLE_STATUSES)[number]);

// Szkic, który kasa zapisała tuż przed płatnością. Klient go nie widzi:
// zamówieniem staje się dopiero wtedy, gdy płatność je domknie.
export const isCheckoutDraft = (raw: RawOrder): boolean =>
  raw.status === OrderStatus.CheckoutDraft;

export const prepareOrderForPayment = (raw: RawOrder): OrderForPayment => ({
  id: raw.id,
  key: raw.order_key ?? "",
  status: toOrderStatus(raw.status),
  items: (raw.line_items ?? []).flatMap((item) =>
    item.product_id ? [{ id: item.product_id, quantity: item.quantity }] : []
  ),
});

export const prepareOrder = (raw: RawOrder): OrderProps => {
  const status = toOrderStatus(raw.status);

  return {
    id: raw.id,
    number: raw.number,
    status,
    dateCreated: raw.date_created,
    total: raw.total,
    currency: raw.currency,
    items: (raw.line_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      total: item.total,
    })),
    payable: isPayableStatus(status),
  };
};

// Języka klient nigdzie nie podaje, a mail musi w jakimś wyjść. Kraj adresu
// jest najbliższą prawdy wskazówką, jaką mamy: Polska → polski, reszta →
// język domyślny sklepu.
const getOrderLocale = (country: string | undefined): string =>
  country === "PL" ? "pl" : routing.defaultLocale;

export const hasReminderBeenSent = (raw: RawOrder): boolean =>
  Boolean(
    raw.meta_data?.find((meta) => meta.key === REMINDER_SENT_META_KEY)?.value
  );

export const prepareUnpaidOrder = (raw: RawOrder): UnpaidOrder | null => {
  const email = raw.billing?.email;
  if (!email) return null;

  return {
    id: raw.id,
    number: raw.number,
    total: raw.total,
    currency: raw.currency,
    email,
    firstName: raw.billing?.first_name ?? "",
    locale: getOrderLocale(raw.billing?.country),
    items: (raw.line_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      total: item.total,
    })),
  };
};

// Klucze, pod którymi zamówienie w euro trzyma kwotę do ewidencji.
export const LEDGER_META = {
  amountPln: "_ledger_amount_pln",
  rate: "_ledger_nbp_rate",
  rateDate: "_ledger_nbp_date",
  rateTable: "_ledger_nbp_table",
} as const;

// Kwota do ewidencji w danych zamówienia — obok notatki, żeby dało się ją
// odczytać bez przepisywania z tekstu (np. do zestawienia sprzedaży).
export const getLedgerMeta = (ledger: LedgerAmount | null) =>
  ledger?.conversion
    ? [
        { key: LEDGER_META.amountPln, value: ledger.conversion.amountPln.toFixed(2) },
        { key: LEDGER_META.rate, value: ledger.conversion.rate.mid.toFixed(4) },
        { key: LEDGER_META.rateDate, value: ledger.conversion.rate.effectiveDate },
        { key: LEDGER_META.rateTable, value: ledger.conversion.rate.table },
      ]
    : [];

export const getLedgerRemark = ({ paidOn, amountEur, conversion }: LedgerAmount): string => {
  const eur = `${formatPlNumber(amountEur, 2)} €`;
  if (!conversion) {
    return (
      `Do ewidencji sprzedaży: nie udało się pobrać kursu NBP. Przelicz ${eur} ` +
      `ręcznie po średnim kursie NBP z ostatniego dnia roboczego przed ` +
      `${formatDayPl(paidOn)}.`
    );
  }
  const { rate, amountPln } = conversion;
  return (
    `Do ewidencji sprzedaży: ${formatPlNumber(amountPln, 2)} zł = ${eur} × ` +
    `${formatPlNumber(rate.mid, 4)} (średni kurs NBP z ${formatDayPl(rate.effectiveDate)}, ` +
    `tabela ${rate.table} — ostatni dzień roboczy przed dniem zapłaty ` +
    `${formatDayPl(paidOn)}).`
  );
};

const getMetaValue = (raw: RawOrder, key: string): string | undefined => {
  const value = raw.meta_data?.find((meta) => meta.key === key)?.value;
  return value === undefined ? undefined : String(value);
};

const parsePositive = (value: string | undefined): number | null => {
  const parsed = parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Płatność w euro odczytana z danych zamówienia (patrz getPaymentMeta
// i getLedgerMeta w OrderService). Przeliczenie jest puste, gdy NBP przy
// zapłacie nie odpowiedział — wtedy dolicza je zestawienie.
const getPreparedEurPayment = (raw: RawOrder, paidAt: string): LedgerAmount | null => {
  if (getMetaValue(raw, "_paid_currency") !== "EUR") return null;
  const amountEur = parsePositive(getMetaValue(raw, "_paid_amount"));
  if (amountEur === null) return null;

  const amountPln = parsePositive(getMetaValue(raw, LEDGER_META.amountPln));
  const mid = parsePositive(getMetaValue(raw, LEDGER_META.rate));
  const effectiveDate = getMetaValue(raw, LEDGER_META.rateDate);
  const table = getMetaValue(raw, LEDGER_META.rateTable);

  return {
    paidOn: getWarsawDay(new Date(paidAt)),
    amountEur,
    conversion:
      amountPln !== null && mid !== null && effectiveDate && table
        ? { amountPln, rate: { mid, effectiveDate, table } }
        : null,
  };
};

export const prepareSalesOrder = (
  raw: RawOrder,
  refunds: RawOrderRefund[]
): SalesOrder | null => {
  if (!raw.date_paid_gmt) return null;
  const paidAt = parseWooGmtDate(raw.date_paid_gmt).toISOString();

  return {
    id: raw.id,
    number: raw.number,
    paidAt,
    totalPln: parseFloat(raw.total) || 0,
    eur: getPreparedEurPayment(raw, paidAt),
    refunds: refunds.map((refund) => ({
      createdAt: parseWooGmtDate(refund.date_created_gmt).toISOString(),
      amountPln: Math.abs(parseFloat(refund.amount) || 0),
    })),
    cancelled: toOrderStatus(raw.status) === OrderStatus.Cancelled,
  };
};

