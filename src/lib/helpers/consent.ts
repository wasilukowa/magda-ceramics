import {
  CookieCategory,
  ConsentChoices,
  CookieConsent,
} from "@/contracts/shared";
import { isDefined, isString } from "@/utility";

// Name of the cookie holding the decision. Read on the server (layout) so the
// banner never flashes for someone who already decided.
export const CONSENT_COOKIE_NAME = "cookie_consent";

// Bump whenever the categories or the cookie policy change in a way that
// makes an earlier decision no longer informed — everyone is asked again.
export const CONSENT_VERSION = 1;

// A decision is remembered for 12 months, then the banner returns.
export const CONSENT_MAX_AGE_DAYS = 365;

// The categories the customer toggles, in display order.
export const OPTIONAL_CATEGORIES = [
  CookieCategory.Analytics,
  CookieCategory.Marketing,
] as const;

// Nothing optional is on before the customer says so — no pre-ticked boxes.
export const REJECTED_CHOICES: ConsentChoices = {
  [CookieCategory.Analytics]: false,
  [CookieCategory.Marketing]: false,
};

export const ACCEPTED_CHOICES: ConsentChoices = {
  [CookieCategory.Analytics]: true,
  [CookieCategory.Marketing]: true,
};

export const createConsent = (choices: ConsentChoices): CookieConsent => ({
  version: CONSENT_VERSION,
  decidedAt: new Date().toISOString(),
  choices,
});

const isConsentChoices = (value: unknown): value is ConsentChoices => {
  if (!isDefined(value) || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return OPTIONAL_CATEGORIES.every(
    (category) => typeof candidate[category] === "boolean",
  );
};

// Parses the raw cookie value. Anything malformed or written under an older
// policy version is treated as "no decision yet", so the banner shows again.
export const parseConsentCookie = (
  raw: string | undefined,
): CookieConsent | null => {
  if (!isString(raw) || raw.length === 0) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (!isDefined(parsed) || typeof parsed !== "object") return null;

    const { version, decidedAt, choices } = parsed as Record<string, unknown>;
    if (version !== CONSENT_VERSION) return null;
    if (!isString(decidedAt) || !isConsentChoices(choices)) return null;

    return { version, decidedAt, choices };
  } catch {
    return null;
  }
};

export const serializeConsentCookie = (consent: CookieConsent): string =>
  encodeURIComponent(JSON.stringify(consent));

// Granted categories, with "necessary" always included.
export const isCategoryGranted = (
  consent: CookieConsent | null,
  category: CookieCategory,
): boolean => {
  if (category === CookieCategory.Necessary) return true;
  return consent?.choices[category] ?? false;
};
