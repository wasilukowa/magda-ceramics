import { afterEach, describe, expect, it, vi } from "vitest";

// Bez bazy Redis — licznik zapasowy w pamięci.
vi.hoisted(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

import { hasExceededLimit, isRateLimited, recordAttempt } from "./rateLimit";

const MINUTE = 60_000;

afterEach(() => {
  vi.useRealTimers();
});

describe("rate limit", () => {
  it("lets the allowed number of attempts through and stops the next one", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await isRateLimited("contact:1.2.3.4", 3, MINUTE));
    expect(results).toEqual([false, false, false, true]);
  });

  it("counts each key separately", async () => {
    for (let i = 0; i < 3; i++) await isRateLimited("contact:5.5.5.5", 3, MINUTE);
    expect(await isRateLimited("contact:6.6.6.6", 3, MINUTE)).toBe(false);
  });

  it("opens again when the window is over", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-19T12:00:00Z") });
    for (let i = 0; i < 3; i++) await isRateLimited("register:7.7.7.7", 3, MINUTE);
    expect(await isRateLimited("register:7.7.7.7", 3, MINUTE)).toBe(true);

    vi.setSystemTime(new Date("2026-10-19T12:01:01Z"));
    expect(await isRateLimited("register:7.7.7.7", 3, MINUTE)).toBe(false);
  });

  it("checks failed logins without counting the check itself", async () => {
    await recordAttempt("login:klient@example.com", MINUTE);
    await recordAttempt("login:klient@example.com", MINUTE);
    expect(await hasExceededLimit("login:klient@example.com", 3)).toBe(false);
    expect(await hasExceededLimit("login:klient@example.com", 3)).toBe(false);
    expect(await hasExceededLimit("login:klient@example.com", 2)).toBe(true);
  });
});
