import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SessionPayload } from "@/contracts/server/auth";

const SESSION_SECRET = process.env.SESSION_SECRET;
const COOKIE_NAME = "mc_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dni

const toBase64Url = (input: string): string =>
  Buffer.from(input).toString("base64url");

const sign = (data: string): string => {
  if (!SESSION_SECRET) throw new Error("Missing SESSION_SECRET env var");
  return createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
};

// Token = base64url(payload).base64url(HMAC-SHA256(payload)).
// Trzymamy własny, podpisany token — wtyczka WordPressa służy tylko do
// sprawdzenia hasła przy logowaniu, sesją zarządzamy sami.
export const createSessionToken = (
  data: Omit<SessionPayload, "exp">,
): string => {
  const payload: SessionPayload = { ...data, exp: Date.now() + SESSION_TTL_MS };
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
};

export const verifySessionToken = (
  token: string | undefined,
): SessionPayload | null => {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (
    expectedBuf.length !== signatureBuf.length ||
    !timingSafeEqual(expectedBuf, signatureBuf)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString(),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.customerId !== "number") return null;
    return payload;
  } catch {
    return null;
  }
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
