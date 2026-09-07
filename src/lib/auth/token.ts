import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET;

// Token = base64url(ładunek).base64url(HMAC-SHA256(ładunek)).
//
// Ten sam kształt noszą ciasteczko sesji i link do ustawienia nowego hasła —
// różnią się tylko zawartością ładunku. Podpisywanie, sprawdzanie podpisu
// i pilnowanie terminu stoi więc w jednym miejscu, a każdy tor dokłada nad tym
// własne sprawdzenia (patrz session.ts i resetToken.ts).
//
// `purpose` jest częścią PODPISANEGO ładunku i jest sprawdzane przy odczycie.
// Bez tego token z linku do zmiany hasła nadawałby się na ciasteczko sesji —
// oba niosą przecież numer klienta i termin ważności.
export type TokenPurpose = "session" | "password-reset";

export type SignedPayload = {
  purpose: TokenPurpose;
  exp: number; // znacznik czasu wygaśnięcia (ms)
};

const sign = (data: string): string => {
  if (!SESSION_SECRET) throw new Error("Missing SESSION_SECRET env var");
  return createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
};

export const createSignedToken = (payload: SignedPayload & object): string => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
};

// Zwraca ładunek, gdy podpis się zgadza, przeznaczenie jest to samo, a termin
// jeszcze nie minął. W każdym innym przypadku — null. Kształt ładunku sprawdza
// już wywołujący, bo tylko on wie, czego oczekuje.
export const readSignedToken = (
  token: string | undefined,
  purpose: TokenPurpose,
): Record<string, unknown> | null => {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as
      | Record<string, unknown>
      | null;
    if (!payload || typeof payload !== "object") return null;
    if (payload.purpose !== purpose) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};
