"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  CookieCategory,
  ConsentChoices,
  CookieConsent,
} from "@/contracts/shared";
import { ConsentStore } from "@/lib/store/slices/consentSlice";
import {
  ACCEPTED_CHOICES,
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_DAYS,
  REJECTED_CHOICES,
  createConsent,
  isCategoryGranted,
  serializeConsentCookie,
} from "@/lib/helpers/consent";

const ConsentContext = createContext<ConsentStore | null>(null);

// The decision lives in a cookie (not localStorage) so the server can read it
// while rendering and decide whether to inject optional scripts at all.
const persist = (consent: CookieConsent): void => {
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(
    consent,
  )}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
};

export function ConsentProvider({
  children,
  initialConsent,
}: {
  children: React.ReactNode;
  initialConsent: CookieConsent | null;
}) {
  const [consent, setConsent] = useState<CookieConsent | null>(initialConsent);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const decide = useCallback((choices: ConsentChoices) => {
    const next = createConsent(choices);
    persist(next);
    setConsent(next);
    setSettingsOpen(false);
  }, []);

  const value = useMemo<ConsentStore>(
    () => ({
      consent,
      isBannerVisible: consent === null,
      isSettingsOpen,
      acceptAll: () => decide(ACCEPTED_CHOICES),
      rejectAll: () => decide(REJECTED_CHOICES),
      saveChoices: decide,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      isGranted: (category: CookieCategory) =>
        isCategoryGranted(consent, category),
    }),
    [consent, isSettingsOpen, decide],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentStore {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used inside ConsentProvider");
  return ctx;
}
