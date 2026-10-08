import "server-only";

import { CancelReason, ReservationRun, ReservationStep } from "@/contracts/server/order";
import { checkoutService } from "@/lib/service/checkout";
import { mailService } from "@/lib/service/mail";
import { buildUnpaidOrderMail } from "@/lib/service/mail/helpers";
import { orderService } from "@/lib/service/order";
import { getDueReminders, getReservationStep } from "@/lib/service/order/helpers";

// Pilnowanie rezerwacji: złożone, nieopłacone zamówienia dostają
// przypomnienie po 12 i po 24 godzinach, a po 48 sklep je anuluje i praca
// wraca do sklepu (decyzja Natalii 2026-10-08). Chodzi co godzinę — budzi je
// zewnętrzny budzik, bo Vercel na planie Hobby pozwala tylko raz na dobę
// (ten dobowy przebieg zostaje jako zapas). Każdy przebieg jest powtarzalny:
// to, co już zrobione, zapisuje się w zamówieniu.
class ReservationService {
  private static instance: ReservationService;

  static getInstance(): ReservationService {
    if (!ReservationService.instance) {
      ReservationService.instance = new ReservationService();
    }
    return ReservationService.instance;
  }

  async run(now = new Date()): Promise<ReservationRun> {
    const orders = await orderService.getReservedOrders();
    const run: ReservationRun = { checked: orders.length, reminded: 0, cancelled: 0, failed: 0 };

    // Po kolei, nie równolegle: serwer WordPressa pracowni łamie się powyżej
    // kilkunastu jednoczesnych zapytań, a to zadanie nigdzie się nie spieszy.
    // Błąd jednego zamówienia nie zatrzymuje reszty — następny przebieg
    // spróbuje jeszcze raz.
    for (const order of orders) {
      try {
        const step = getReservationStep(order, now);

        if (step === ReservationStep.Expire) {
          await checkoutService.cancelUnpaidOrder(order.id, CancelReason.Expired);
          run.cancelled += 1;
        } else if (step === ReservationStep.Remind) {
          if (!(await mailService.send(await buildUnpaidOrderMail({ order })))) {
            throw new Error("reminder not accepted");
          }
          // Licznik dopiero po wysłaniu — gdyby poczta odmówiła, następny
          // przebieg spróbuje jeszcze raz. Zaległe przypomnienia nie idą
          // seriami: zapisujemy, ile POWINNO już wyjść.
          await orderService.markRemindersSent(order.id, getDueReminders(order, now));
          run.reminded += 1;
        }
      } catch (error) {
        console.error(`Reservations: order ${order.id} not handled:`, error);
        run.failed += 1;
      }
    }

    return run;
  }
}

export const reservationService = ReservationService.getInstance();
