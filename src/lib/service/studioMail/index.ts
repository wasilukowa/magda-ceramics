import "server-only";

import { parseEmails } from "@/lib/helpers/email";
import { mailService } from "@/lib/service/mail";
import { buildStudioNewOrderMail } from "@/lib/service/mail/helpers";
import { orderService } from "@/lib/service/order";
import { ORDER_META } from "@/lib/service/order/helpers";

// Mail trafia na adres pracowni — ten sam, na który przychodzą wiadomości
// z formularza i miesięczne zestawienie sprzedaży.
const RECIPIENTS = parseEmails(process.env.CONTACT_RECIPIENT_EMAIL);

// Mail „nowe zamówienie" dla Magdy — zastępuje angielski mail WooCommerce
// w złotych. Tak jak maile do klienta: nie może zatrzymać zapisu zapłaty,
// a wysyła się raz (znacznik w zamówieniu).
class StudioMailService {
  private static instance: StudioMailService;

  static getInstance(): StudioMailService {
    if (!StudioMailService.instance) {
      StudioMailService.instance = new StudioMailService();
    }
    return StudioMailService.instance;
  }

  // `conflicts` — nazwy prac, które w chwili zapłaty były już sprzedane.
  // `awaitingConfirmation` — metoda odroczona: bank jeszcze potwierdza.
  async sendNewOrder(
    orderId: number,
    {
      conflicts = [],
      awaitingConfirmation = false,
    }: { conflicts?: string[]; awaitingConfirmation?: boolean } = {}
  ): Promise<void> {
    if (RECIPIENTS.length === 0) {
      console.error("Studio mail: missing CONTACT_RECIPIENT_EMAIL env var");
      return;
    }

    try {
      const order = await orderService.getStudioOrderMail(orderId);
      if (!order || order.notified) return;

      const sent = await mailService.send(
        await buildStudioNewOrderMail({ order, to: RECIPIENTS, conflicts, awaitingConfirmation })
      );
      if (!sent) throw new Error("mail not accepted");

      await orderService
        .updateMeta(orderId, [
          { key: ORDER_META.mailStudioNewOrder, value: new Date().toISOString() },
        ])
        .catch((error) =>
          console.error(`Order ${orderId}: studio mail flag not saved:`, error)
        );
    } catch (error) {
      console.error(`Order ${orderId}: studio new-order mail not sent:`, error);
    }
  }
}

export const studioMailService = StudioMailService.getInstance();
