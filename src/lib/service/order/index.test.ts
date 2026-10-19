import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_WP_URL = "https://wp.example.com";
  process.env.WC_CONSUMER_KEY = "ck_test";
  process.env.WC_CONSUMER_SECRET = "cs_test";
});

import { orderService } from "./index";

const ORDER_ID = 731;
const TIMEOUT = new DOMException("The operation was aborted due to timeout", "TimeoutError");

type Call = { method: string; path: string };

// WooCommerce na niby: złożenie (PUT) kończy się tak, jak każe test,
// a odczyt pokazuje, co WordPress naprawdę zapisał.
const fakeWooCommerce = (placement: () => Response, savedStatus: string) => {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const path = url.replace("https://wp.example.com/wp-json/wc/v3/", "");
      calls.push({ method, path });
      if (method === "PUT") return placement();
      if (method === "GET") return Response.json({ status: savedStatus });
      return Response.json({});
    })
  );
  return calls;
};

const timedOut = () => {
  throw TIMEOUT;
};

// Przerwy między sprawdzeniami mijają od razu.
const markPlaced = async () => {
  const result = orderService.markPlaced(ORDER_ID);
  result.catch(() => {});
  await vi.runAllTimersAsync();
  return result;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("placing an order", () => {
  it("places the order when WooCommerce answers", async () => {
    const calls = fakeWooCommerce(() => Response.json({}), "on-hold");
    await expect(markPlaced()).resolves.toMatch(/^\d{4}-/);
    expect(calls.map((call) => call.method)).toEqual(["PUT", "POST"]);
  });

  it("goes on when the answer is lost but the order was placed", async () => {
    const calls = fakeWooCommerce(timedOut, "on-hold");
    await expect(markPlaced()).resolves.toMatch(/^\d{4}-/);
    expect(calls).toEqual([
      { method: "PUT", path: `orders/${ORDER_ID}` },
      { method: "GET", path: `orders/${ORDER_ID}?_fields=status` },
      { method: "POST", path: `orders/${ORDER_ID}/notes` },
    ]);
  });

  it("fails when the order is still a draft after every check", async () => {
    const calls = fakeWooCommerce(timedOut, "checkout-draft");
    await expect(markPlaced()).rejects.toBe(TIMEOUT);
    expect(calls.map((call) => call.method)).toEqual(["PUT", "GET", "GET"]);
  });

  it("fails at once when WooCommerce refuses the order", async () => {
    const calls = fakeWooCommerce(() => new Response(null, { status: 400 }), "on-hold");
    await expect(markPlaced()).rejects.toThrow("400");
    expect(calls.map((call) => call.method)).toEqual(["PUT"]);
  });
});
