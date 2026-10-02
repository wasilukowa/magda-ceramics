import "server-only";

import { getTranslations } from "next-intl/server";
import { MailMessage } from "@/contracts/server/mail";
import {
  CustomerMailInput,
  CustomerMailKind,
  DeliveryKind,
  StudioOrderMail,
  UnpaidOrder,
} from "@/contracts/server/order";
import { CONTACT_EMAIL, SITE_URL } from "@/content/data";
import { getPathname } from "@/i18n/navigation";
import { formatPrice } from "@/lib/helpers/currency";
import { Currency } from "@/contracts/shared";
import { escapeHtml } from "@/lib/helpers/html";
import {
  SalesEntry,
  SalesEntryKind,
  SalesReport,
} from "@/contracts/server/salesReport";
import { formatCsvAmount, toCsv } from "@/lib/helpers/csv";
import { formatDayPl, formatMonthPl } from "@/lib/helpers/date";
import { formatPlNumber } from "@/lib/helpers/ledger";

// Treść maila z linkiem do zmiany hasła. Wszystkie zdania idą z tłumaczeń
// (namespace `auth.reset.email`), więc obie wersje językowe stoją obok siebie
// w messages/*.json, a nie w kodzie.
//
// Styl jest wpisany w atrybuty `style` — programy pocztowe nie czytają
// arkuszy stylów, a większość obcina wszystko z <head>. Kolory te same, co
// tokeny sklepu w globals.css.
export const buildPasswordResetMail = async ({
  to,
  locale,
  url,
}: {
  to: string;
  locale: string;
  url: string;
}): Promise<MailMessage> => {
  const t = await getTranslations({ locale, namespace: "auth.reset.email" });

  const text = [
    t("heading"),
    "",
    t("intro"),
    "",
    url,
    "",
    t("ignore"),
    "",
    t("signature"),
  ].join("\n");

  const html = `
<div style="margin:0;padding:32px 16px;background:#faf9f7;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;">
    <p style="margin:0 0 32px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b6b6b;">Magda Ceramics</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;letter-spacing:0.02em;">${t("heading")}</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#1a1a1a;">${t("intro")}</p>
    <p style="margin:0 0 32px;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;border:1px solid #1a1a1a;color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">${t("button")}</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b6b6b;">${t("fallback")}</p>
    <p style="margin:0 0 32px;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${url}" style="color:#57756F;">${url}</a></p>
    <p style="margin:0 0 32px;font-size:13px;line-height:1.7;color:#6b6b6b;">${t("ignore")}</p>
    <p style="margin:0;padding-top:24px;border-top:1px solid #e5e2dc;font-size:13px;color:#6b6b6b;">${t("signature")}</p>
  </div>
</div>`.trim();

  return { to, subject: t("subject"), text, html };
};


// Przypomnienie o niezapłaconym zamówieniu. Ton jest uprzejmy, nie
// windykacyjny: zamówienie mogło zostać przerwane przez cokolwiek — zerwane
// łącze, odrzuconą kartę, telefon w połowie płatności. Ważne zdanie jest jedno
// i mówi prawdę o tej pracowni: każda praca istnieje w jednym egzemplarzu,
// więc czekanie ma swoją cenę.
export const buildUnpaidOrderMail = async ({
  order,
  url,
}: {
  order: UnpaidOrder;
  url: string;
}): Promise<MailMessage> => {
  const t = await getTranslations({
    locale: order.locale,
    namespace: "account.pay.email",
  });

  const lines = order.items
    .map((item) =>
      item.quantity > 1 ? `${item.name} × ${item.quantity}` : item.name
    )
    .join(", ");

  const total = formatPrice(order.total, order.currency);

  const text = [
    t("heading", { name: order.firstName }),
    "",
    t("intro", { number: order.number, items: lines, total }),
    "",
    url,
    "",
    t("single"),
    "",
    t("ignore"),
    "",
    t("signature"),
  ].join("\n");

  const html = `
<div style="margin:0;padding:32px 16px;background:#faf9f7;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;">
    <p style="margin:0 0 32px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b6b6b;">Magda Ceramics</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;letter-spacing:0.02em;">${t("heading", { name: order.firstName })}</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;">${t("intro", { number: order.number, items: lines, total })}</p>
    <p style="margin:0 0 32px;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;border:1px solid #1a1a1a;color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">${t("button")}</a>
    </p>
    <p style="margin:0 0 32px;font-size:13px;line-height:1.7;color:#6b6b6b;">${t("single")}</p>
    <p style="margin:0 0 32px;font-size:13px;line-height:1.7;color:#6b6b6b;">${t("ignore")}</p>
    <p style="margin:0;padding-top:24px;border-top:1px solid #e5e2dc;font-size:13px;color:#6b6b6b;">${t("signature")}</p>
  </div>
</div>`.trim();

  // Odpowiedź klienta ma trafić tam, gdzie przy pozostałych mailach
  // o zamówieniu — na skrzynkę pracowni, a nie na adres nadawcy.
  return {
    to: order.email,
    replyTo: CONTACT_EMAIL,
    subject: t("subject", { number: order.number }),
    text,
    html,
  };
};


// Miesięczne zestawienie sprzedaży dla Magdy. Mail jest tylko po polsku,
// więc jego teksty stoją wyłącznie w messages/pl.json (`salesReport.email`).
// Ta sama tabela idzie w treści i w załączniku CSV — z maila widać wynik od
// razu, a plik da się otworzyć w arkuszu, wydrukować albo przekazać dalej.
export const buildSalesReportMail = async ({
  report,
  to,
}: {
  report: SalesReport;
  to: string[];
}): Promise<MailMessage> => {
  const t = await getTranslations({ locale: "pl", namespace: "salesReport.email" });

  const month = formatMonthPl(report.month);
  const countOf = (kind: SalesEntryKind) =>
    report.entries.filter((entry) => entry.kind === kind).length;
  const unconverted = report.entries.filter((entry) => entry.amountPln === null).length;

  const eurRemarkFor = (entry: SalesEntry): string => {
    if (!entry.eur) return "";
    const amount = formatPlNumber(entry.eur.amountEur, 2);
    if (!entry.eur.conversion) {
      return t("remarks.eurMissing", { amount, date: formatDayPl(entry.eur.paidOn) });
    }
    const { rate } = entry.eur.conversion;
    return t("remarks.eur", {
      amount,
      rate: formatPlNumber(rate.mid, 4),
      date: formatDayPl(rate.effectiveDate),
      table: rate.table,
    });
  };

  const remarkFor = (entry: SalesEntry): string => {
    if (entry.kind === SalesEntryKind.Refund) {
      return entry.eur ? t("remarks.refundEur") : t("remarks.refund");
    }
    return [eurRemarkFor(entry), entry.needsRefundCheck ? t("remarks.cancelled") : ""]
      .filter(Boolean)
      .join("; ");
  };

  const columns = [
    t("columns.number"),
    t("columns.date"),
    t("columns.order"),
    t("columns.amount"),
    t("columns.running"),
    t("columns.remarks"),
  ];
  const rows = report.entries.map((entry, index) => ({
    cells: [
      String(index + 1),
      formatDayPl(entry.day),
      `#${entry.orderNumber}`,
      // Brak kwoty pokazany wprost — puste miejsce w tekście maila zlewało
      // się z sąsiednią kolumną i suma narastająco udawała kwotę.
      entry.amountPln === null ? "—" : formatPlNumber(entry.amountPln, 2),
      formatPlNumber(entry.runningTotalPln, 2),
      remarkFor(entry),
    ],
    csvAmount: entry.amountPln === null ? "" : formatCsvAmount(entry.amountPln),
    csvRunning: formatCsvAmount(entry.runningTotalPln),
  }));

  const hasEntries = rows.length > 0;
  const summary = hasEntries
    ? t("summary", {
        sales: countOf(SalesEntryKind.Sale),
        refunds: countOf(SalesEntryKind.Refund),
        total: `${formatPlNumber(report.totalPln, 2)} zł`,
      })
    : t("empty");
  const notes = hasEntries
    ? [
        t("explanation"),
        ...(unconverted ? [t("unconverted", { count: unconverted })] : []),
        t("attachment"),
      ]
    : [];

  const text = [
    t("heading", { month }),
    "",
    summary,
    "",
    ...rows.map(({ cells }) => cells.join("  ").trim()),
    ...(hasEntries ? [""] : []),
    ...notes.flatMap((note) => [note, ""]),
    t("signature"),
  ].join("\n");

  const cell = "padding:8px 10px;border-bottom:1px solid #e5e2dc;vertical-align:top;text-align:left;";
  // Kwoty (kolumny 4 i 5) wyrównane do prawej, żeby grosze stały pod groszami.
  const align = (index: number) => (index === 3 || index === 4 ? "text-align:right;white-space:nowrap;" : "");
  const table = hasEntries
    ? `
    <table style="width:100%;border-collapse:collapse;margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
      <tr>${columns.map((column, index) => `<th style="${cell}${align(index)}font-weight:normal;color:#6b6b6b;">${column}</th>`).join("")}</tr>
      ${rows.map(({ cells }) => `<tr>${cells.map((value, index) => `<td style="${cell}${align(index)}">${value}</td>`).join("")}</tr>`).join("")}
      <tr><td style="${cell}"></td><td style="${cell}"></td><td style="${cell}">${t("total")}</td><td style="${cell}${align(3)}">${formatPlNumber(report.totalPln, 2)}</td><td style="${cell}"></td><td style="${cell}"></td></tr>
    </table>`
    : "";

  const html = `
<div style="margin:0;padding:32px 16px;background:#faf9f7;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <div style="max-width:680px;margin:0 auto;">
    <p style="margin:0 0 32px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b6b6b;">Magda Ceramics</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;letter-spacing:0.02em;">${t("heading", { month })}</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;">${summary}</p>${table}
    ${notes.map((note) => `<p style="margin:0 0 16px;font-size:13px;line-height:1.7;color:#6b6b6b;">${note}</p>`).join("")}
    <p style="margin:16px 0 0;padding-top:24px;border-top:1px solid #e5e2dc;font-size:13px;color:#6b6b6b;">${t("signature")}</p>
  </div>
</div>`.trim();

  const csv = toCsv([
    columns,
    ...rows.map(({ cells, csvAmount, csvRunning }) => [
      cells[0],
      cells[1],
      cells[2],
      csvAmount,
      csvRunning,
      cells[5],
    ]),
    ["", "", t("total"), formatCsvAmount(report.totalPln), "", ""],
  ]);

  return {
    to,
    subject: t("subject", { month }),
    text,
    html,
    attachments: hasEntries
      ? [
          {
            filename: `sprzedaz-${report.month}.csv`,
            content: Buffer.from(csv, "utf-8").toString("base64"),
            contentType: "text/csv; charset=utf-8",
          },
        ]
      : undefined,
  };
};


// --- Maile do klienta o zamówieniu ---------------------------------------------
// Wysyła je sklep, nie WooCommerce: w języku, w którym klient zamawiał,
// i z kwotami w walucie, w której płacił (patrz OrderPreferences). Treść stoi
// w tłumaczeniach (namespace `orderEmail`) — zmiana zdania to edycja
// messages/*.json, nie kodu.

const MAIL_FONT = "font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;";
const MUTED = "color:#6b6b6b;";
const RULE = "border-top:1px solid #e5e2dc;";

// Akapit z tekstu, który może mieć kilka linii (notatka Magdy, uwaga klienta).
const multiline = (text: string): string =>
  escapeHtml(text).replace(/\n/g, "<br />");

// Numer paczkomatu jako osobny, wyraźny wiersz — to po nim nadaje się paczkę
// i po nim klient ją odbiera, więc nie może ginąć w drobnym nagłówku.
const lockerCodeHtml = (label: string): string =>
  `<p style="margin:0 0 8px;font-size:18px;font-weight:bold;letter-spacing:0.04em;">${escapeHtml(label)}</p>`;

const absoluteUrl = (locale: string, href: "/terms" | "/account/orders"): string =>
  `${SITE_URL}${getPathname({ locale, href })}`;

export const buildCustomerOrderMail = async ({
  kind,
  order,
  note,
  refund,
}: CustomerMailInput): Promise<MailMessage> => {
  const { locale } = order.preferences;
  const t = await getTranslations({ locale, namespace: "orderEmail" });
  const { amounts, delivery } = order;
  const money = (value: number) => formatPrice(value, amounts.currency);
  const number = order.number;

  const greeting = order.firstName
    ? t("greeting", { name: order.firstName })
    : t("greetingNoName");

  const refundSentence = (() => {
    if (kind !== CustomerMailKind.Refunded || !refund) return "";
    if (refund.amount === null) return t("refunded.partialNoAmount", { number });
    return t(refund.full ? "refunded.full" : "refunded.partial", {
      number,
      amount: money(refund.amount),
    });
  })();
  const intro =
    kind === CustomerMailKind.Refunded ? refundSentence : t(`${kind}.intro`, { number });

  const showSummary =
    kind === CustomerMailKind.Confirmed || kind === CustomerMailKind.OnHold;
  const showDelivery = showSummary || kind === CustomerMailKind.Shipped;
  const showAccount = order.hasAccount && (showSummary || kind === CustomerMailKind.Shipped);

  const shippingLabel =
    delivery.kind === DeliveryKind.Locker ? t("shippingLocker") : t("shippingCourier");
  const deliveryTitle =
    delivery.kind === DeliveryKind.Locker ? t("deliveryLocker") : t("deliveryCourier");
  const lockerLine =
    delivery.kind === DeliveryKind.Locker && delivery.lockerCode
      ? t("lockerCode", { code: delivery.lockerCode })
      : "";
  const termsUrl = absoluteUrl(locale, "/terms");
  const accountUrl = absoluteUrl(locale, "/account/orders");

  // --- wersja tekstowa ---
  const text = [
    greeting,
    "",
    intro,
    ...(kind === CustomerMailKind.Refunded ? ["", t("refunded.timing")] : []),
    ...(kind === CustomerMailKind.Note && note ? ["", note] : []),
    ...(showSummary
      ? [
          "",
          t("summary"),
          ...amounts.items.map(
            (item) =>
              `${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""} — ${money(item.total)}`
          ),
          `${shippingLabel} — ${money(amounts.shipping)}`,
          `${t("total")}: ${money(amounts.total)}`,
        ]
      : []),
    ...(showDelivery
      ? ["", deliveryTitle, ...(lockerLine ? [lockerLine] : []), ...delivery.lines]
      : []),
    ...(showSummary && order.note ? ["", `${t("yourNote")}: ${order.note}`] : []),
    ...(showAccount ? ["", `${t("account")} ${accountUrl}`] : []),
    ...(showSummary ? ["", `${t("terms")} ${termsUrl}`] : []),
    "",
    t("help"),
    "",
    t("signature"),
  ].join("\n");

  // --- wersja HTML ---
  const row = (label: string, value: string, strong = false) => `
      <tr>
        <td style="padding:8px 0;${strong ? "font-weight:bold;" : ""}">${label}</td>
        <td style="padding:8px 0;text-align:right;white-space:nowrap;${strong ? "font-weight:bold;" : ""}">${value}</td>
      </tr>`;

  const summaryHtml = showSummary
    ? `
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;${MUTED}">${t("summary")}</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 28px;font-size:14px;${RULE}">
      ${amounts.items
        .map((item) =>
          row(
            `${escapeHtml(item.name)}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`,
            money(item.total)
          )
        )
        .join("")}
      ${row(shippingLabel, money(amounts.shipping))}
      <tr><td colspan="2" style="${RULE}"></td></tr>
      ${row(t("total"), money(amounts.total), true)}
    </table>`
    : "";

  const deliveryHtml = showDelivery
    ? `
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;${MUTED}">${escapeHtml(deliveryTitle)}</p>
    ${lockerLine ? lockerCodeHtml(lockerLine) : ""}
    <p style="margin:0 0 28px;font-size:14px;line-height:1.6;">${delivery.lines.map(escapeHtml).join("<br />")}</p>`
    : "";

  const noteHtml =
    kind === CustomerMailKind.Note && note
      ? `<p style="margin:0 0 28px;padding:16px 20px;background:#f1efeb;font-size:15px;line-height:1.7;">${multiline(note)}</p>`
      : "";
  const customerNoteHtml =
    showSummary && order.note
      ? `<p style="margin:0 0 28px;font-size:13px;line-height:1.6;${MUTED}">${t("yourNote")}: ${multiline(order.note)}</p>`
      : "";
  const link = (url: string, label: string) =>
    `<a href="${url}" style="color:#57756F;">${label}</a>`;

  const html = `
<div style="margin:0;padding:32px 16px;background:#faf9f7;${MAIL_FONT}">
  <div style="max-width:560px;margin:0 auto;">
    <p style="margin:0 0 32px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;${MUTED}">Magda Ceramics</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;letter-spacing:0.02em;">${t(`${kind}.heading`)}</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
    ${kind === CustomerMailKind.Refunded ? `<p style="margin:0 0 28px;font-size:13px;line-height:1.7;${MUTED}">${t("refunded.timing")}</p>` : ""}
    ${noteHtml}
    ${summaryHtml}
    ${deliveryHtml}
    ${customerNoteHtml}
    ${showAccount ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;${MUTED}">${t("account")} ${link(accountUrl, t("accountLink"))}</p>` : ""}
    ${showSummary ? `<p style="margin:0 0 28px;font-size:13px;line-height:1.6;${MUTED}">${t("terms")} ${link(termsUrl, t("termsLink"))}</p>` : ""}
    <p style="margin:0 0 32px;font-size:13px;line-height:1.7;${MUTED}">${t("help")}</p>
    <p style="margin:0;padding-top:24px;${RULE}font-size:13px;${MUTED}">${t("signature")}</p>
  </div>
</div>`.trim();

  return {
    to: order.email,
    replyTo: CONTACT_EMAIL,
    subject: t(`${kind}.subject`, { number }),
    text,
    html,
  };
};


// --- Mail „nowe zamówienie" do pracowni -----------------------------------------
// Zastępuje angielski mail WooCommerce w złotych. Po polsku (tylko
// messages/pl.json, `studioOrderEmail`), z tym, co klient naprawdę zapłacił,
// i z kwotą do ewidencji przy euro. Odpowiedź idzie prosto do klienta.

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const LANGUAGE_NAMES: Record<string, string> = { pl: "polski", en: "angielski" };

export const buildStudioNewOrderMail = async ({
  order,
  to,
  conflicts,
  awaitingConfirmation,
}: {
  order: StudioOrderMail;
  to: string[];
  conflicts: string[];
  awaitingConfirmation: boolean;
}): Promise<MailMessage> => {
  const t = await getTranslations({ locale: "pl", namespace: "studioOrderEmail" });
  const number = order.number;
  const pln = (value: number) => formatPrice(value, Currency.PLN);
  const paid = formatPrice(order.paidTotal, order.paidCurrency);
  // Panel WooCommerce na nowych tabelach zamówień (HPOS).
  const adminUrl = `${WP_URL}/wp-admin/admin.php?page=wc-orders&action=edit&id=${order.id}`;

  const ledgerLine =
    order.paidCurrency === Currency.EUR
      ? order.ledger?.conversion
        ? t("ledger", {
            amount: `${formatPlNumber(order.ledger.conversion.amountPln, 2)} zł`,
            rate: formatPlNumber(order.ledger.conversion.rate.mid, 4),
            date: formatDayPl(order.ledger.conversion.rate.effectiveDate),
            table: order.ledger.conversion.rate.table,
          })
        : t("ledgerMissing")
      : "";
  const warnings = [
    ...(awaitingConfirmation ? [t("awaiting")] : []),
    ...(conflicts.length ? [t("conflicts", { items: conflicts.join(", ") })] : []),
  ];
  const customerLines = [
    order.customerName,
    order.email,
    order.phone,
    t("account", { hasAccount: order.hasAccount ? "yes" : "no" }),
    t("language", { language: LANGUAGE_NAMES[order.customerLocale] ?? order.customerLocale }),
  ].filter(Boolean);
  const deliveryTitle =
    order.delivery.kind === DeliveryKind.Locker ? t("deliveryLocker") : t("deliveryCourier");
  const lockerLine =
    order.delivery.kind === DeliveryKind.Locker && order.delivery.lockerCode
      ? t("lockerCode", { code: order.delivery.lockerCode })
      : "";
  const itemLabel = (item: StudioOrderMail["items"][number]) =>
    `${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`;

  const text = [
    t("heading", { number }),
    "",
    ...warnings.flatMap((warning) => [warning, ""]),
    t("customerTitle"),
    ...customerLines,
    "",
    t("paymentTitle"),
    t("paid", { amount: paid }),
    ...(ledgerLine ? [ledgerLine] : []),
    "",
    t("itemsTitle"),
    ...order.items.map((item) => `${itemLabel(item)} — ${pln(item.totalPln)}`),
    `${t("shipping")} — ${pln(order.shippingPln)}`,
    `${t("total")}: ${pln(order.totalPln)}`,
    "",
    deliveryTitle,
    ...(lockerLine ? [lockerLine] : []),
    ...order.delivery.lines,
    ...(order.note ? ["", `${t("noteTitle")}: ${order.note}`] : []),
    "",
    `${t("open")}: ${adminUrl}`,
    "",
    t("reply"),
    t("footer"),
  ].join("\n");

  const section = (title: string, body: string) => `
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;${MUTED}">${escapeHtml(title)}</p>
    ${body}`;
  const lines = (values: string[]) =>
    `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;">${values.map(escapeHtml).join("<br />")}</p>`;
  const row = (label: string, value: string, strong = false) => `
      <tr>
        <td style="padding:6px 0;${strong ? "font-weight:bold;" : ""}">${escapeHtml(label)}</td>
        <td style="padding:6px 0;text-align:right;white-space:nowrap;${strong ? "font-weight:bold;" : ""}">${value}</td>
      </tr>`;

  const html = `
<div style="margin:0;padding:32px 16px;background:#faf9f7;${MAIL_FONT}">
  <div style="max-width:560px;margin:0 auto;">
    <p style="margin:0 0 32px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;${MUTED}">Magda Ceramics</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;">${escapeHtml(t("heading", { number }))}</h1>
    ${warnings
      .map(
        (warning) =>
          `<p style="margin:0 0 20px;padding:14px 18px;background:#f6e3dc;color:#a8442a;font-size:14px;line-height:1.6;">${escapeHtml(warning)}</p>`
      )
      .join("")}
    ${section(t("customerTitle"), lines(customerLines))}
    ${section(t("paymentTitle"), lines([t("paid", { amount: paid }), ...(ledgerLine ? [ledgerLine] : [])]))}
    ${section(
      t("itemsTitle"),
      `<table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px;${RULE}">
      ${order.items.map((item) => row(itemLabel(item), pln(item.totalPln))).join("")}
      ${row(t("shipping"), pln(order.shippingPln))}
      <tr><td colspan="2" style="${RULE}"></td></tr>
      ${row(t("total"), pln(order.totalPln), true)}
    </table>`
    )}
    ${section(deliveryTitle, `${lockerLine ? lockerCodeHtml(lockerLine) : ""}${lines(order.delivery.lines)}`)}
    ${order.note ? section(t("noteTitle"), `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;">${multiline(order.note)}</p>`) : ""}
    <p style="margin:0 0 28px;">
      <a href="${adminUrl}" style="display:inline-block;padding:14px 32px;border:1px solid #1a1a1a;color:#1a1a1a;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">${t("open")}</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;${MUTED}">${t("reply")}</p>
    <p style="margin:0;padding-top:24px;${RULE}font-size:13px;${MUTED}">${t("footer")}</p>
  </div>
</div>`.trim();

  return {
    to,
    ...(order.email ? { replyTo: order.email } : {}),
    subject: t("subject", { number, total: paid, customer: order.customerName || "none" }),
    text,
    html,
  };
};

