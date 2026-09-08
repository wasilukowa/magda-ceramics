import "server-only";

import { getTranslations } from "next-intl/server";
import { MailMessage } from "@/contracts/server/mail";
import { UnpaidOrder } from "@/contracts/server/order";

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
