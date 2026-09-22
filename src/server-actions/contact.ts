"use server";

import { z } from "zod";
import { Resend } from "resend";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ContactFormState, ContactFormValues } from "@/contracts/server/contact";
import { isRateLimited } from "@/lib/helpers/rateLimit";

const parseEmails = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

// Jawni odbiorcy (widoczni w mailu). Można podać kilku, oddzielonych przecinkiem.
const RECIPIENTS = parseEmails(process.env.CONTACT_RECIPIENT_EMAIL);
// Ukryte kopie (BCC) — adresy niewidoczne dla pozostałych odbiorców.
const BCC = parseEmails(process.env.CONTACT_BCC_EMAIL);
// Until magdaceramics.com is verified in Resend, the shared sender is used.
const FROM = process.env.CONTACT_FROM_EMAIL ?? "Magda Ceramics <onboarding@resend.dev>";

// Każda wysłana wiadomość kosztuje: ląduje w skrzynce Magdy i zjada limit
// Resenda, więc po tysiącu śmieci nie dotarłaby już żadna prawdziwa. Liczy się
// zatem każda próba, nie tylko udana.
const CONTACT_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_LIMIT_PER_EMAIL = 3;
const CONTACT_LIMIT_PER_IP = 5;

// Pole-pułapka. W formularzu jest odsunięte poza ekran i schowane przed
// czytnikami ekranu, więc żaden człowiek go nie zobaczy ani w nie nie trafi
// tabulatorem — a automat, który wypełnia wszystko, co znajdzie, zostawi tu
// ślad. Nazwa jest zwyczajna („subject"), żeby wyglądała wiarygodnie dla bota
// i żeby przeglądarka nie podstawiła w nie niczego z autouzupełniania.
const HONEYPOT_FIELD = "subject";

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const t = await getTranslations("contact");

  const values: ContactFormValues = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };

  // Botowi mówimy, że się udało. Gdyby dostał błąd, autor automatu zobaczyłby,
  // że pułapka istnieje, i nauczyłby go ją omijać.
  if (String(formData.get(HONEYPOT_FIELD) ?? "").trim() !== "") {
    console.warn("Contact form: honeypot filled, message dropped");
    return { status: "success", message: t("success") };
  }

  const schema = z.object({
    name: z.string().min(1, t("errors.name")),
    email: z.email(t("errors.email")),
    message: z.string().min(1, t("errors.message")),
  });

  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: t("errors.validation"),
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        message: fieldErrors.message?.[0],
      },
      values,
    };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (
    isRateLimited(
      `contact:email:${parsed.data.email.toLowerCase()}`,
      CONTACT_LIMIT_PER_EMAIL,
      CONTACT_WINDOW_MS,
    ) ||
    isRateLimited(`contact:ip:${ip}`, CONTACT_LIMIT_PER_IP, CONTACT_WINDOW_MS)
  ) {
    // Bez adresu i bez IP w logu — to dane osobowe, a do zauważenia, że ktoś
    // wali w formularz, wystarczy sam ślad.
    console.warn("Contact form: rate limit hit");
    // Tu, inaczej niż przy pułapce, po drugiej stronie stoi zwykle człowiek —
    // należy mu się prawdziwa odpowiedź, a nie udawany sukces.
    return { status: "error", message: t("errors.tooMany"), values };
  }

  if (!process.env.RESEND_API_KEY || RECIPIENTS.length === 0) {
    console.error(
      "Contact form: missing RESEND_API_KEY or CONTACT_RECIPIENT_EMAIL env var",
    );
    return { status: "error", message: t("errors.server"), values };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: RECIPIENTS,
      ...(BCC.length > 0 && { bcc: BCC }),
      replyTo: parsed.data.email,
      subject: `Magda Ceramics — ${parsed.data.name}`,
      text: `${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
    });

    if (error) {
      console.error("Resend error:", error);
      return { status: "error", message: t("errors.server"), values };
    }
  } catch (err) {
    console.error("Contact form send failed:", err);
    return { status: "error", message: t("errors.server"), values };
  }

  return { status: "success", message: t("success") };
}
