import "server-only";

import { Resend } from "resend";
import { MailMessage } from "@/contracts/server/mail";

// Jeden nadawca dla całego sklepu. Zmienna nazywa się CONTACT_*, bo powstała
// przy formularzu kontaktowym — adres jest ten sam, więc nie mnożymy wpisów
// w konfiguracji Vercela.
const FROM =
  process.env.CONTACT_FROM_EMAIL ?? "Magda Ceramics <onboarding@resend.dev>";

// Jeden klient Resenda na całą aplikację (wzorzec singleton). Warstwa
// TRANSPORTU — o tym, co jest w mailu, decydują helpers.ts i tłumaczenia.
class MailService {
  private static instance: MailService;
  private client: Resend | null = null;

  static getInstance(): MailService {
    if (!MailService.instance) {
      MailService.instance = new MailService();
    }
    return MailService.instance;
  }

  private getClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!this.client) this.client = new Resend(process.env.RESEND_API_KEY);
    return this.client;
  }

  // Zwraca true, gdy Resend przyjął wiadomość. Powód niepowodzenia ląduje
  // w logu serwera — do klienta nigdy nie idzie treść błędu poczty.
  async send(message: MailMessage): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      console.error("Mail: missing RESEND_API_KEY env var");
      return false;
    }

    try {
      const { error } = await client.emails.send({ from: FROM, ...message });
      if (error) {
        console.error("Resend error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Mail send failed:", err);
      return false;
    }
  }
}

export const mailService = MailService.getInstance();
