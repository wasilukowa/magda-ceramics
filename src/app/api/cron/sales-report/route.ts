import { z } from "zod";
import { mailService } from "@/lib/service/mail";
import { buildSalesReportMail } from "@/lib/service/mail/helpers";
import { salesReportService } from "@/lib/service/salesReport";
import { getPreviousMonth } from "@/lib/service/salesReport/helpers";
import { getWarsawDay } from "@/lib/helpers/date";
import { parseEmails } from "@/lib/helpers/email";

// Zestawienie idzie na adres pracowni — ten sam, na który przychodzą
// wiadomości z formularza kontaktowego. Nie mnożymy wpisów w konfiguracji.
const RECIPIENTS = parseEmails(process.env.CONTACT_RECIPIENT_EMAIL);

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

// Zadanie z Vercel Cron — pierwszego dnia miesiąca rano, za miesiąc
// poprzedni. `?month=2026-09` wysyła zestawienie za wskazany miesiąc (np. gdy
// trzeba je powtórzyć). Nagłówek `authorization` wysyła sam Vercel; bez
// CRON_SECRET trasa nie robi nic, bo zestawienie sprzedaży to nie jest coś,
// co może zamówić ktokolwiek z internetu.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Sales report: missing CRON_SECRET env var");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (RECIPIENTS.length === 0) {
    console.error("Sales report: missing CONTACT_RECIPIENT_EMAIL env var");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  const requested = new URL(request.url).searchParams.get("month");
  const parsed = requested === null ? null : monthSchema.safeParse(requested);
  if (parsed && !parsed.success) {
    return Response.json({ error: "invalid month" }, { status: 400 });
  }
  const month = parsed?.data ?? getPreviousMonth(getWarsawDay(new Date()));

  let report;
  try {
    report = await salesReportService.getReport(month);
  } catch (error) {
    console.error(`Sales report ${month}: WooCommerce lookup failed:`, error);
    return Response.json({ error: "lookup failed" }, { status: 503 });
  }

  const sent = await mailService.send(
    await buildSalesReportMail({ report, to: RECIPIENTS })
  );

  return Response.json(
    { month, entries: report.entries.length, sent },
    { status: sent ? 200 : 502 }
  );
}
