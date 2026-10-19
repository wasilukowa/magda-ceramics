import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

// token.ts czyta sekret przy imporcie.
vi.hoisted(() => {
  process.env.SESSION_SECRET = "test-session-secret";
});

import { SignedPayload, createSignedToken, readSignedToken } from "./token";
import { createPasswordResetToken, verifyPasswordResetToken } from "./resetToken";

const HOUR = 60 * 60 * 1000;
const inAnHour = () => Date.now() + HOUR;

// Ładunek z danymi klienta obok przeznaczenia i terminu.
const sign = (payload: SignedPayload & Record<string, unknown>) => createSignedToken(payload);

const encode = (payload: object) => Buffer.from(JSON.stringify(payload)).toString("base64url");

afterEach(() => {
  vi.useRealTimers();
});

describe("signed tokens", () => {
  it("reads back what was signed", () => {
    const token = sign({ purpose: "session", exp: inAnHour(), customerId: 7 });
    expect(readSignedToken(token, "session")).toMatchObject({ customerId: 7 });
  });

  it("rejects a token whose content was changed", () => {
    const token = sign({ purpose: "session", exp: inAnHour(), customerId: 7 });
    const [, signature] = token.split(".");
    const forged = `${encode({ purpose: "session", exp: inAnHour(), customerId: 8 })}.${signature}`;
    expect(readSignedToken(forged, "session")).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const encoded = encode({ purpose: "session", exp: inAnHour(), customerId: 7 });
    const signature = createHmac("sha256", "someone-elses-secret").update(encoded).digest("base64url");
    expect(readSignedToken(`${encoded}.${signature}`, "session")).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = sign({ purpose: "session", exp: Date.now() - 1, customerId: 7 });
    expect(readSignedToken(token, "session")).toBeNull();
  });

  it("does not accept a password-reset link as a login session", () => {
    const token = sign({ purpose: "password-reset", exp: inAnHour(), customerId: 7 });
    expect(readSignedToken(token, "session")).toBeNull();
  });

  it("rejects garbage", () => {
    for (const garbage of [undefined, "", "abc", "a.b.c", "."]) {
      expect(readSignedToken(garbage, "session")).toBeNull();
    }
  });
});

describe("password-reset link", () => {
  const account = { customerId: 7, email: "klient@example.com", modifiedAt: "2026-10-19T10:00:00" };

  it("works for an hour", () => {
    vi.useFakeTimers({ now: new Date("2026-10-19T12:00:00Z") });
    const token = createPasswordResetToken(account);

    vi.setSystemTime(new Date("2026-10-19T12:59:00Z"));
    expect(verifyPasswordResetToken(token)).toMatchObject(account);

    vi.setSystemTime(new Date("2026-10-19T13:01:00Z"));
    expect(verifyPasswordResetToken(token)).toBeNull();
  });

  it("does not accept a login session as a reset link", () => {
    const session = sign({ purpose: "session", exp: inAnHour(), ...account });
    expect(verifyPasswordResetToken(session)).toBeNull();
  });

  it("rejects a signed link with missing account details", () => {
    const token = sign({
      purpose: "password-reset",
      exp: inAnHour(),
      customerId: "7",
      email: account.email,
      modifiedAt: account.modifiedAt,
    });
    expect(verifyPasswordResetToken(token)).toBeNull();
  });
});
