import { orderService } from "@/lib/service/order";
import { mailService } from "@/lib/service/mail";
import { buildUnpaidOrderMail } from "@/lib/service/mail/helpers";
import { getBaseUrl } from "@/lib/api";

// Ile zamówienie ma poczekać, zanim przypomnimy, i jak stare przestaje nas
// obchodzić. Doba to prośba Natalii; tydzień jako sufit, żeby po włączeniu
// zadania nie odezwać się nagle do wszystkich zaległych zamówień naraz.
const REMIND_AFTER_HOURS = 24;
const GIVE_UP_AFTER_DAYS = 7;

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000);
const daysAgo = (days: number) => hoursAgo(days * 24);

// Adres strony płatności w języku klienta. Angielski jest domyślny i chodzi
// bez przedrostka — patrz routing `localePrefix: "as-needed"`.
const getPayUrl = (orderId: number, locale: string): string => {
  const base = getBaseUrl();
  return locale === "pl"
    ? `${base}/pl/konto/zamowienia/zaplac?order=${orderId}`
    : `${base}/account/orders/pay?order=${orderId}`;
};

// Zadanie z Vercel Cron — codziennie. Nagłówek `authorization` wysyła sam
// Vercel; bez CRON_SECRET trasa nie robi nic, żeby publiczny adres nie mógł
// rozesłać maili na żądanie kogokolwiek z internetu.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Unpaid reminders: missing CRON_SECRET env var");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let orders;
  try {
    orders = await orderService.getOrdersAwaitingReminder({
      olderThan: hoursAgo(REMIND_AFTER_HOURS),
      notOlderThan: daysAgo(GIVE_UP_AFTER_DAYS),
    });
  } catch (error) {
    console.error("Unpaid reminders: WooCommerce lookup failed:", error);
    return Response.json({ error: "lookup failed" }, { status: 503 });
  }

  let sent = 0;

  // Po kolei, nie równolegle: serwer WordPressa pracowni łamie się powyżej
  // kilkunastu jednoczesnych zapytań, a to zadanie nigdzie się nie spieszy.
  for (const order of orders) {
    const mail = await buildUnpaidOrderMail({
      order,
      url: getPayUrl(order.id, order.locale),
    });

    if (!(await mailService.send(mail))) continue;

    // Znacznik stawiamy dopiero po wysłaniu — gdyby poczta odmówiła, jutrzejszy
    // przebieg spróbuje jeszcze raz zamiast uznać sprawę za załatwioną.
    try {
      await orderService.markReminderSent(order.id);
      sent += 1;
    } catch (error) {
      console.error(`Unpaid reminders: could not mark order ${order.id}:`, error);
    }
  }

  return Response.json({ checked: orders.length, sent });
}
