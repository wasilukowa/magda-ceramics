"use client";

import { createContext, use, useCallback, useContext, useMemo, useState } from "react";
import {
  CookieCategory,
  ConsentChoices,
  CookieConsent,
} from "@/contracts/shared";
import { ConsentStore, ConsentActions } from "@/lib/store/slices/consentSlice";
import {
  ACCEPTED_CHOICES,
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_DAYS,
  REJECTED_CHOICES,
  createConsent,
  isCategoryGranted,
  serializeConsentCookie,
} from "@/lib/helpers/consent";

type ConsentContextValue = ConsentActions & {
  // Decyzja podjęta w tej karcie. `undefined` znaczy „jeszcze żadnej", więc
  // obowiązuje ta z serwera; `null` to świadome „nie zdecydowano".
  localConsent: CookieConsent | undefined;
  // Zgoda odczytana z ciasteczka na serwerze — jako obietnica, bo layout nie
  // może na nią czekać, patrz komentarz przy AuthProvider.
  serverConsent: Promise<CookieConsent | null>;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

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
  serverConsent,
}: {
  children: React.ReactNode;
  serverConsent: Promise<CookieConsent | null>;
}) {
  const [localConsent, setLocalConsent] = useState<CookieConsent | undefined>(
    undefined,
  );
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const decide = useCallback((choices: ConsentChoices) => {
    const next = createConsent(choices);
    persist(next);
    setLocalConsent(next);
    setSettingsOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      localConsent,
      serverConsent,
      isSettingsOpen,
      acceptAll: () => decide(ACCEPTED_CHOICES),
      rejectAll: () => decide(REJECTED_CHOICES),
      saveChoices: decide,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [localConsent, serverConsent, isSettingsOpen, decide],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

const useConsentContext = (): ConsentContextValue => {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used inside ConsentProvider");
  return ctx;
};

// Same czynności — otwarcie panelu, zapis wyboru. NIE dotyka zgody, więc nie
// zawiesza się na obietnicy z serwera: przycisk w stopce stoi w statycznej
// skorupie strony i ma się renderować od razu.
export function useConsentActions(): ConsentActions {
  return useConsentContext();
}

// Pełny stan łącznie z zapamiętaną zgodą. Czyta obietnicę z serwera, więc
// wywołujący musi mieć nad sobą <Suspense>.
export function useConsent(): ConsentStore {
  const ctx = useConsentContext();
  const { localConsent, serverConsent, ...actions } = ctx;

  // `use` wolno wołać warunkowo — gdy klient już zdecydował w tej karcie,
  // obietnica z serwera jest nieaktualna i nie ma po co w nią zaglądać.
  const consent = localConsent !== undefined ? localConsent : use(serverConsent);

  return {
    ...actions,
    consent,
    isBannerVisible: consent === null,
    isGranted: (category: CookieCategory) =>
      isCategoryGranted(consent, category),
  };
}
