import "server-only";

import { getTranslations } from "next-intl/server";
import { MailMessage } from "@/contracts/server/mail";
import { UnpaidOrder } from "@/contracts/server/order";
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

  const total = `${order.total} ${order.currency}`;

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

  return { to: order.email, subject: t("subject", { number: order.number }), text, html };
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

