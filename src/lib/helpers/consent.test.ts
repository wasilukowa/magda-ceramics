import { describe, expect, it } from "vitest";
import { CookieCategory } from "@/contracts/shared";
import {
  ACCEPTED_CHOICES,
  CONSENT_VERSION,
  REJECTED_CHOICES,
  createConsent,
  isCategoryGranted,
  parseConsentCookie,
  serializeConsentCookie,
} from "./consent";

const cookie = (value: object) => encodeURIComponent(JSON.stringify(value));

describe("cookie consent", () => {
  it("remembers the customer's decision", () => {
    const consent = createConsent(ACCEPTED_CHOICES);
    expect(parseConsentCookie(serializeConsentCookie(consent))).toEqual(consent);
  });

  it("asks again after the policy version changes", () => {
    const old = { version: CONSENT_VERSION - 1, decidedAt: "2026-08-12", choices: ACCEPTED_CHOICES };
    expect(parseConsentCookie(cookie(old))).toBeNull();
  });

  it("asks again when the cookie is broken", () => {
    expect(parseConsentCookie(undefined)).toBeNull();
    expect(parseConsentCookie("%7Bnie-json")).toBeNull();
    const missingChoice = {
      version: CONSENT_VERSION,
      decidedAt: "2026-10-19",
      choices: { [CookieCategory.Analytics]: true },
    };
    expect(parseConsentCookie(cookie(missingChoice))).toBeNull();
  });

  it("turns nothing optional on before the customer decides", () => {
    expect(isCategoryGranted(null, CookieCategory.Necessary)).toBe(true);
    expect(isCategoryGranted(null, CookieCategory.Analytics)).toBe(false);
    expect(isCategoryGranted(createConsent(REJECTED_CHOICES), CookieCategory.Marketing)).toBe(false);
    expect(isCategoryGranted(createConsent(ACCEPTED_CHOICES), CookieCategory.Marketing)).toBe(true);
  });
});
