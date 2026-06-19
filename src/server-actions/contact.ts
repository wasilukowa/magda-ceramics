"use server";

import { z } from "zod";
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import { ContactFormState, ContactFormValues } from "@/contracts/server/contact";

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
