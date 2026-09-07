import "server-only";

import { cookies } from "next/headers";
import { SessionPayload } from "@/contracts/server/auth";
import { createSignedToken, readSignedToken } from "@/lib/auth/token";

const COOKIE_NAME = "mc_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dni

// Trzymamy własny, podpisany token — wtyczka WordPressa służy tylko do
// sprawdzenia hasła przy logowaniu, sesją zarządzamy sami. Sam podpis i jego
// weryfikacja siedzą w lib/auth/token.ts, wspólne z linkiem do zmiany hasła.
export const createSessionToken = (
  data: Omit<SessionPayload, "exp">,
): string =>
  createSignedToken({
    ...data,
    purpose: "session",
    exp: Date.now() + SESSION_TTL_MS,
  });

export const verifySessionToken = (
  token: string | undefined,
): SessionPayload | null => {
  const payload = readSignedToken(token, "session");
  if (!payload) return null;
  if (typeof payload.customerId !== "number") return null;
  if (typeof payload.email !== "string") return null;

  return {
    customerId: payload.customerId,
    email: payload.email,
    exp: payload.exp as number,
  };
};

export const setSessionCookie = async (
  data: Omit<SessionPayload, "exp">,
): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
};

export const readSessionCookie = async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
};

export const clearSessionCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};
