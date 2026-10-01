import "server-only";

import {
  CustomerMailInput,
  CustomerMailKind,
  CustomerOrderMail,
  OrderStatus,
  RawOrder,
} from "@/contracts/server/order";
import { mailService } from "@/lib/service/mail";
import { buildCustomerOrderMail } from "@/lib/service/mail/helpers";
import { orderService } from "@/lib/service/order";
import {
  isCheckoutDraft,
  ORDER_META,
  prepareCustomerOrderMail,
} from "@/lib/service/order/helpers";
import { getRefundAmount } from "./helpers";

// Maile do klienta o jego zamówieniu — w języku i walucie klienta. Zastępują
// maile WooCommerce (angielskie i w złotych dla wszystkich). Potwierdzenie
// wysyła domknięcie płatności; resztę (wysłane, notatka Magdy, zwrot) — webhook
// WooCommerce, bo te rzeczy dzieją się w panelu WordPressa.
//
// Żaden mail nie może zatrzymać tego, co go wywołało: płatność jest zapisana,
// zanim mail wyjdzie. Nieudany mail zostaje w logu i w notatce dla Magdy.
class CustomerMailService {
  private static instance: CustomerMailService;

  static getInstance(): CustomerMailService {
    if (!CustomerMailService.instance) {
      CustomerMailService.instance = new CustomerMailService();
    }
    return CustomerMailService.instance;
  }

  // Wysyłka + znacznik w zamówieniu, żeby ten sam mail nie poszedł drugi raz.
  // Znacznik stawiamy dopiero po wysłaniu — nieudany mail może spróbować
  // jeszcze raz przy następnej okazji.
  private async deliver(
    input: CustomerMailInput,
    sentMeta: { key: string; value: string } | null
  ): Promise<boolean> {
    const { order, kind } = input;
    try {
      const sent = await mailService.send(await buildCustomerOrderMail(input));
      if (!sent) throw new Error("mail not accepted");
    } catch (error) {
      console.error(`Order ${order.id}: ${kind} mail not sent:`, error);
      await orderService
        .addPrivateNote(
          order.id,
          `Mail do klienta (${kind}) nie wyszedł — warto napisać do klienta ręcznie.`
        )
        .catch(() => {});
      return false;
    }

    if (sentMeta) {
      try {
        await orderService.updateMeta(order.id, [sentMeta]);
      } catch (error) {
        console.error(`Order ${order.id}: ${kind} mail flag not saved:`, error);
      }
    }
    return true;
  }

  private now = () => new Date().toISOString();

  private async loadOrder(orderId: number): Promise<CustomerOrderMail | null> {
    try {
      return await orderService.getCustomerOrderMail(orderId);
    } catch (error) {
      console.error(`Order ${orderId}: lookup for customer mail failed:`, error);
      return null;
    }
  }

  // Zapłacone — potwierdzenie zamówienia.
  async sendConfirmation(orderId: number): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order || order.sent.confirmation) return;
    await this.deliver(
      { kind: CustomerMailKind.Confirmed, order },
      { key: ORDER_META.mailConfirmation, value: this.now() }
    );
  }

  // Metoda odroczona — zamówienie przyjęte, bank jeszcze potwierdza.
  async sendOnHold(orderId: number): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order || order.sent.onHold || order.sent.confirmation) return;
    await this.deliver(
      { kind: CustomerMailKind.OnHold, order },
      { key: ORDER_META.mailOnHold, value: this.now() }
    );
  }

  // Notatka „dla klienta" dodana przez Magdę w panelu. Każda notatka to osobne
  // zdarzenie, więc bez znacznika.
  async sendNote(orderId: number, note: string): Promise<void> {
    const text = note.trim();
    if (!text) return;
    const order = await this.loadOrder(orderId);
    if (!order) return;
    await this.deliver({ kind: CustomerMailKind.Note, order, note: text }, null);
  }

  // Zamówienie zmienione w WooCommerce (webhook „order.updated"). Treść
  // żądania to całe zamówienie, więc nie trzeba o nie pytać drugi raz.
  async handleOrderUpdated(raw: RawOrder): Promise<void> {
    if (isCheckoutDraft(raw)) return;
    const order = prepareCustomerOrderMail(raw);
    if (!order) return;

    // „Zrealizowane" w panelu = paczka wysłana.
    if (raw.status === OrderStatus.Completed && !order.sent.shipped) {
      await this.deliver(
        { kind: CustomerMailKind.Shipped, order },
        { key: ORDER_META.mailShipped, value: this.now() }
      );
    }

    // Zwroty, o których klient jeszcze nie wie. Lista numerów rośnie po
    // każdym wysłanym mailu — zapisujemy ją w całości.
    const notified = [...order.sent.refundIds];
    for (const refund of order.refunds) {
      if (notified.includes(refund.id)) continue;
      const delivered = await this.deliver(
        {
          kind: CustomerMailKind.Refunded,
          order,
          refund: getRefundAmount(order, refund.amountPln),
        },
        { key: ORDER_META.mailRefunds, value: [...notified, refund.id].join(",") }
      );
      if (delivered) notified.push(refund.id);
    }
  }
}

export const customerMailService = CustomerMailService.getInstance();
