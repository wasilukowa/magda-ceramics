import { timingSafeEqual } from "node:crypto";
import { hasLocale } from "next-intl";
import {
  CustomerOrderMail,
  DeliveryKind,
  OrderAmounts,
  OrderDelivery,
  OrderForPayment,
  OrderPaymentState,
  OrderPreferences,
  OrderProps,
  OrderStatus,
  PAYABLE_STATUSES,
  RawOrder,
  RawOrderRefund,
  ReservationStep,
  SalesOrder,
  StudioOrderMail,
  UnpaidOrder,
} from "@/contracts/server/order";
import { PaymentStatus } from "@/contracts/server/payment";
import { LedgerAmount } from "@/contracts/server/exchangeRate";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { routing } from "@/i18n/routing";
import { convertPlnToEur } from "@/lib/helpers/currency";
import { formatDayPl, getWarsawDay, parseWooGmtDate } from "@/lib/helpers/date";
import { formatPlNumber } from "@/lib/helpers/ledger";
import { getCountryLabel, getShippingCost } from "@/lib/helpers/shipping";

// Złożone zamówienie trzyma pracę tyle godzin. Przypomnienia o zapłacie idą
// po 12 i po 24 godzinach od złożenia, a po 48 sklep anuluje zamówienie
// i praca wraca do sklepu (decyzja Natalii 2026-10-08).
export const RESERVATION_HOURS = 48;
export const REMINDER_AFTER_HOURS = [12, 24] as const;

const HOUR_MS = 3_600_000;

// Do kiedy praca czeka, licząc od chwili złożenia zamówienia.
export const getReservationDeadline = (placedAt: Date): string =>
  new Date(placedAt.getTime() + RESERVATION_HOURS * HOUR_MS).toISOString();

export const toOrderStatus = (status: string): OrderStatus =>
  Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : OrderStatus.Pending;

export const isPayableStatus = (status: OrderStatus): boolean =>
  PAYABLE_STATUSES.includes(status as (typeof PAYABLE_STATUSES)[number]);

// Zamówienie złożone z konta klienta. Gość ma w WooCommerce customer_id 0.
export const hasCustomerAccount = (raw: RawOrder): boolean =>
  (raw.customer_id ?? 0) > 0;

// Szkic, który kasa zapisała tuż przed płatnością. Klient go nie widzi:
// zamówieniem staje się dopiero wtedy, gdy płatność je domknie.
export const isCheckoutDraft = (raw: RawOrder): boolean =>
  raw.status === OrderStatus.CheckoutDraft;

// Dane, które sklep dopisuje do zamówienia w WooCommerce.
export const ORDER_META = {
  // Język i waluta z kasy — patrz OrderPreferences.
  locale: "_mc_locale",
  currency: "_mc_currency",
  // Do kiedy praca czeka zarezerwowana (ISO) — zapisywane przy złożeniu.
  reservedUntil: "_mc_reserved_until",
  // Ostatnia płatność w Stripe założona dla zamówienia (kasa albo strona
  // zamówienia). Jedna naraz — przy anulowaniu zamykamy właśnie ją.
  paymentIntent: "_mc_payment_intent",
  // Ile przypomnień o zapłacie już wyszło.
  reminders: "_mc_payment_reminders",
  // Stan płatności i jej numer w chwili zapisu (zapisuje OrderService).
  stripeStatus: "_stripe_payment_status",
  stripeIntent: "_stripe_payment_intent",
  // Zapłata w euro (zapisuje OrderService przy zapłacie).
  paidCurrency: "_paid_currency",
  paidAmount: "_paid_amount",
  // Które maile do klienta już wyszły — żeby żaden nie poszedł dwa razy.
  mailPlaced: "_mc_mail_placed",
  mailCancelled: "_mc_mail_cancelled",
  mailConfirmation: "_mc_mail_confirmation",
  mailOnHold: "_mc_mail_on_hold",
  mailShipped: "_mc_mail_shipped",
  // Numery zwrotów, o których klient już wie, po przecinku.
  mailRefunds: "_mc_mail_refunds",
  // Mail „nowe zamówienie" do pracowni.
  mailStudioNewOrder: "_mc_mail_studio_new_order",
} as const;

// Kod paczkomatu w zamówieniu (zapisuje go kasa — CheckoutService.saveDraftOrder).
// Jest tylko w zamówieniach do paczkomatu, więc mówi też o sposobie dostawy.
export const LOCKER_META_KEY = "_inpost_locker_id";

// Dopisek o paczkomacie, który kasa dokłada do uwagi klienta (patrz
// CheckoutService.saveDraftOrder). Mail pokazuje paczkomat osobno, więc
// z uwagi go zdejmujemy.
export const LOCKER_NOTE_PREFIX = "Paczkomat InPost: ";

const getMetaValue = (raw: RawOrder, key: string): string | undefined => {
  const value = raw.meta_data?.find((meta) => meta.key === key)?.value;
  return value === undefined ? undefined : String(value);
};

const parsePositive = (value: string | undefined): number | null => {
  const parsed = parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toAmount = (value: string | undefined): number => {
  const parsed = parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};

// Język dla zamówień sprzed zapisywania go w kasie. Kraj adresu jest
// najbliższą prawdy wskazówką: Polska → polski, reszta → język domyślny.
const getOrderLocale = (country: string | undefined): string =>
  country === "PL" ? "pl" : routing.defaultLocale;

// Waluta klienta. Zapłacone liczy się tak, jak pobrał Stripe: w euro tylko
// wtedy, gdy przy zapłacie zapisało się euro. Niezapłacone — tak, jak klient
// wybrał w kasie.
const getOrderCurrency = (raw: RawOrder): Currency => {
  if (getMetaValue(raw, ORDER_META.paidCurrency) === "EUR") return Currency.EUR;
  if (raw.date_paid_gmt) return Currency.PLN;
  return getMetaValue(raw, ORDER_META.currency) === Currency.EUR
    ? Currency.EUR
    : Currency.PLN;
};

export const getOrderPreferences = (raw: RawOrder): OrderPreferences => {
  const locale = getMetaValue(raw, ORDER_META.locale);
  return {
    locale: hasLocale(routing.locales, locale)
      ? locale
      : getOrderLocale(raw.billing?.country),
    currency: getOrderCurrency(raw),
  };
};

// Kwoty w walucie klienta. Złotówki idą prosto z WooCommerce. Euro liczymy
// tą samą regułą co kasa (cena sztuki przeliczona i zaokrąglona w górę,
// wysyłka z cennika dla kraju i sposobu dostawy), a suma opłaconego
// zamówienia to kwota, którą pobrał Stripe — nie nasze przeliczenie.
export const getOrderAmounts = (raw: RawOrder, currency: Currency): OrderAmounts => {
  const lines = raw.line_items ?? [];

  if (currency === Currency.PLN) {
    return {
      currency,
      items: lines.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        total: toAmount(item.total),
      })),
      shipping: toAmount(raw.shipping_total),
      total: toAmount(raw.total),
    };
  }

  const items = lines.map((item) => {
    const quantity = item.quantity || 1;
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      total: convertPlnToEur(toAmount(item.total) / quantity) * quantity,
    };
  });
  const country = raw.shipping?.country || raw.billing?.country || "";
  const method = getMetaValue(raw, LOCKER_META_KEY)
    ? DeliveryMethod.Locker
    : DeliveryMethod.Courier;
  const shipping = getShippingCost(country, Currency.EUR, method);
  const paid = parsePositive(getMetaValue(raw, ORDER_META.paidAmount));

  return {
    currency,
    items,
    shipping,
    total: paid ?? items.reduce((sum, item) => sum + item.total, 0) + shipping,
  };
};

// Stripe powiedział „płatność w toku" i nic się od tamtej pory nie zmieniło —
// bank potwierdza płatność metodą odroczoną (np. Klarna).
const isAwaitingConfirmation = (raw: RawOrder): boolean =>
  toOrderStatus(raw.status) === OrderStatus.OnHold &&
  getMetaValue(raw, ORDER_META.stripeStatus) === PaymentStatus.Processing;

const getReservedUntil = (raw: RawOrder): string | null => {
  const value = getMetaValue(raw, ORDER_META.reservedUntil);
  return value && !Number.isNaN(Date.parse(value)) ? value : null;
};

export const getPaymentState = (raw: RawOrder): OrderPaymentState => {
  const status = toOrderStatus(raw.status);
  if (status === OrderStatus.Processing || status === OrderStatus.Completed) {
    return OrderPaymentState.Paid;
  }
  if (status === OrderStatus.Cancelled) return OrderPaymentState.Cancelled;
  if (status === OrderStatus.Refunded) return OrderPaymentState.Refunded;
  return isAwaitingConfirmation(raw)
    ? OrderPaymentState.AwaitingConfirmation
    : OrderPaymentState.Unpaid;
};

// Czy podany klucz to klucz tego zamówienia. Porównanie w stałym czasie —
// klucz jest jedynym, co chroni stronę zamówienia otwieraną z maila.
export const isOrderKey = (raw: RawOrder, key: string): boolean => {
  const expected = Buffer.from(raw.order_key ?? "");
  const received = Buffer.from(key);
  return (
    expected.length > 0 &&
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
};

export const prepareOrderForPayment = (raw: RawOrder): OrderForPayment => ({
  id: raw.id,
  key: raw.order_key ?? "",
  status: toOrderStatus(raw.status),
  items: (raw.line_items ?? []).flatMap((item) =>
    item.product_id ? [{ id: item.product_id, quantity: item.quantity }] : []
  ),
  awaitingConfirmation: isAwaitingConfirmation(raw),
  reservedUntil: getReservedUntil(raw),
  paymentIntentId: getMetaValue(raw, ORDER_META.paymentIntent) || null,
  confirmationSent: Boolean(getMetaValue(raw, ORDER_META.mailConfirmation)),
  studioNotified: Boolean(getMetaValue(raw, ORDER_META.mailStudioNewOrder)),
});

export const prepareOrder = (raw: RawOrder): OrderProps => {
  const status = toOrderStatus(raw.status);
  const { currency, items, total } = getOrderAmounts(
    raw,
    getOrderPreferences(raw).currency
  );
  const paymentState = getPaymentState(raw);
  const waiting = paymentState === OrderPaymentState.Unpaid;

  return {
    id: raw.id,
    number: raw.number,
    key: raw.order_key ?? "",
    status,
    dateCreated: raw.date_created,
    total,
    currency,
    items,
    paymentState,
    reservedUntil: waiting ? getReservedUntil(raw) : null,
    payable: waiting && isPayableStatus(status),
  };
};

// Null, gdy zamówienie nie ma adresu albo rezerwacji — takich (sprzed
// 2026-10-08) zadanie z przypomnieniami nie rusza.
export const prepareUnpaidOrder = (raw: RawOrder): UnpaidOrder | null => {
  const email = raw.billing?.email;
  const reservedUntil = getReservedUntil(raw);
  if (!email || !reservedUntil) return null;

  const { locale, currency } = getOrderPreferences(raw);
  const amounts = getOrderAmounts(raw, currency);
  const reminders = Number(getMetaValue(raw, ORDER_META.reminders));

  return {
    id: raw.id,
    number: raw.number,
    key: raw.order_key ?? "",
    total: amounts.total,
    currency,
    email,
    firstName: raw.billing?.first_name ?? "",
    locale,
    items: amounts.items,
    reservedUntil,
    remindersSent: Number.isInteger(reminders) && reminders > 0 ? reminders : 0,
    awaitingConfirmation: isAwaitingConfirmation(raw),
  };
};

// Co zrobić z nieopłaconym zamówieniem teraz. Po terminie — anulować (także
// gdy bank „potwierdzał" płatność: o tym, czy pieniądze idą, rozstrzyga
// wtedy Stripe, patrz CheckoutService.cancelUnpaidOrder). Przed terminem —
// przypomnieć, jeśli minęło 12 albo 24 h, a przypomnienie jeszcze nie wyszło.
// Zadanie, które przez kilka godzin nie chodziło, wysyła jedno przypomnienie,
// nie dwa naraz (patrz getDueReminders).
export const getReservationStep = (order: UnpaidOrder, now: Date): ReservationStep => {
  if (now.getTime() >= Date.parse(order.reservedUntil)) return ReservationStep.Expire;
  if (order.awaitingConfirmation) return ReservationStep.Wait;
  return getDueReminders(order, now) > order.remindersSent
    ? ReservationStep.Remind
    : ReservationStep.Wait;
};

// Ile przypomnień powinno już wyjść, licząc od chwili złożenia.
export const getDueReminders = (order: UnpaidOrder, now: Date): number => {
  const placedAt = Date.parse(order.reservedUntil) - RESERVATION_HOURS * HOUR_MS;
  const elapsedHours = (now.getTime() - placedAt) / HOUR_MS;
  return REMINDER_AFTER_HOURS.filter((hours) => elapsedHours >= hours).length;
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

// Płatność w euro odczytana z danych zamówienia (patrz getPaymentMeta
// i getLedgerMeta w OrderService). Przeliczenie jest puste, gdy NBP przy
// zapłacie nie odpowiedział — wtedy dolicza je zestawienie.
const getPreparedEurPayment = (raw: RawOrder, paidAt: string): LedgerAmount | null => {
  if (getMetaValue(raw, ORDER_META.paidCurrency) !== "EUR") return null;
  const amountEur = parsePositive(getMetaValue(raw, ORDER_META.paidAmount));
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

// Gdzie jedzie paczka: paczkomat (kod i adres punktu) albo adres dla kuriera.
const getOrderDelivery = (raw: RawOrder, locale: string): OrderDelivery => {
  const lockerCode = getMetaValue(raw, LOCKER_META_KEY) ?? null;
  const shipping = raw.shipping ?? {};
  const billing = raw.billing ?? {};
  const name = [billing.first_name, billing.last_name].filter(Boolean).join(" ");
  const cityLine = [shipping.postcode, shipping.city].filter(Boolean).join(" ");
  const country = shipping.country ? getCountryLabel(shipping.country, locale) : "";

  return {
    kind: lockerCode ? DeliveryKind.Locker : DeliveryKind.Courier,
    lockerCode,
    lines: [
      name,
      shipping.address_1 ?? "",
      shipping.address_2 ?? "",
      cityLine,
      country,
    ].filter(Boolean),
  };
};

// Uwaga klienta bez dopisku o paczkomacie, który dokłada kasa.
const getCustomerOwnNote = (raw: RawOrder): string =>
  (raw.customer_note ?? "")
    .split("\n")
    .filter((line) => !line.startsWith(LOCKER_NOTE_PREFIX))
    .join("\n")
    .trim();

const parseIdList = (value: string | undefined): number[] =>
  (value ?? "")
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

export const prepareCustomerOrderMail = (raw: RawOrder): CustomerOrderMail | null => {
  const email = raw.billing?.email;
  if (!email) return null;

  const preferences = getOrderPreferences(raw);

  return {
    id: raw.id,
    number: raw.number,
    key: raw.order_key ?? "",
    reservedUntil:
      getPaymentState(raw) === OrderPaymentState.Unpaid ? getReservedUntil(raw) : null,
    email,
    firstName: raw.billing?.first_name ?? "",
    preferences,
    amounts: getOrderAmounts(raw, preferences.currency),
    delivery: getOrderDelivery(raw, preferences.locale),
    note: getCustomerOwnNote(raw),
    hasAccount: hasCustomerAccount(raw),
    sent: {
      placed: Boolean(getMetaValue(raw, ORDER_META.mailPlaced)),
      confirmation: Boolean(getMetaValue(raw, ORDER_META.mailConfirmation)),
      onHold: Boolean(getMetaValue(raw, ORDER_META.mailOnHold)),
      cancelled: Boolean(getMetaValue(raw, ORDER_META.mailCancelled)),
      shipped: Boolean(getMetaValue(raw, ORDER_META.mailShipped)),
      refundIds: parseIdList(getMetaValue(raw, ORDER_META.mailRefunds)),
    },
    refunds: (raw.refunds ?? []).map((refund) => ({
      id: refund.id,
      amountPln: Math.abs(toAmount(refund.total)),
    })),
    totalPln: toAmount(raw.total),
  };
};

export const prepareStudioOrderMail = (raw: RawOrder): StudioOrderMail => {
  const { locale, currency } = getOrderPreferences(raw);
  const billing = raw.billing ?? {};
  const paidAt = raw.date_paid_gmt
    ? parseWooGmtDate(raw.date_paid_gmt).toISOString()
    : new Date().toISOString();

  return {
    id: raw.id,
    number: raw.number,
    customerName: [billing.first_name, billing.last_name].filter(Boolean).join(" "),
    email: billing.email ?? "",
    phone: billing.phone ?? "",
    hasAccount: hasCustomerAccount(raw),
    customerLocale: locale,
    items: (raw.line_items ?? []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      totalPln: toAmount(item.total),
    })),
    shippingPln: toAmount(raw.shipping_total),
    totalPln: toAmount(raw.total),
    paidCurrency: currency,
    paidTotal: getOrderAmounts(raw, currency).total,
    ledger: getPreparedEurPayment(raw, paidAt),
    delivery: getOrderDelivery(raw, "pl"),
    note: getCustomerOwnNote(raw),
    notified: Boolean(getMetaValue(raw, ORDER_META.mailStudioNewOrder)),
  };
};

