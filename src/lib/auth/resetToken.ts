import "server-only";

import { PasswordResetPayload } from "@/contracts/server/auth";
import { createSignedToken, readSignedToken } from "@/lib/auth/token";

// Godzina. Dość, żeby zajrzeć do skrzynki i wrócić; za mało, żeby link
// przeleżał w niej tydzień i wciąż otwierał konto.
const RESET_TTL_MS = 60 * 60 * 1000;

// Link do zmiany hasła nie jest nigdzie zapisywany — cała treść siedzi
// w podpisanym tokenie. Dzięki temu nie potrzebujemy tabeli na kody, a token
// nie da się podrobić bez SESSION_SECRET.
//
// JEDNORAZOWOŚĆ bierze się z `modifiedAt`: to data ostatniej zmiany konta
// w WooCommerce. Zmiana hasła ją przesuwa, więc token wystawiony wcześniej
// przestaje pasować i drugi raz już nie zadziała. Ubocznie link unieważnia
// też każda inna zmiana konta (np. edycja adresu) — to bezpieczna strona
// pomyłki: w najgorszym razie klient poprosi o nowy link.
export const createPasswordResetToken = (
  data: Omit<PasswordResetPayload, "exp" | "purpose">,
): string =>
  createSignedToken({
    ...data,
    purpose: "password-reset",
    exp: Date.now() + RESET_TTL_MS,
  });

export const verifyPasswordResetToken = (
  token: string | undefined,
): PasswordResetPayload | null => {
  const payload = readSignedToken(token, "password-reset");
  if (!payload) return null;
  if (typeof payload.customerId !== "number") return null;
  if (typeof payload.email !== "string") return null;
  if (typeof payload.modifiedAt !== "string") return null;

  return {
    purpose: "password-reset",
    customerId: payload.customerId,
    email: payload.email,
    modifiedAt: payload.modifiedAt,
    exp: payload.exp as number,
  };
};
