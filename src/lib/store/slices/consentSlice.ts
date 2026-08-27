import {
  CookieCategory,
  ConsentChoices,
  CookieConsent,
} from "@/contracts/shared";

// Czynności panelu zgód. Wydzielone, bo można ich używać bez znajomości samej
// zgody — a ta przychodzi z serwera obietnicą i zawiesza komponent, patrz
// ConsentProvider.
export type ConsentActions = {
  // The category panel, opened from the banner or from the footer link
  isSettingsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveChoices: (choices: ConsentChoices) => void;
  openSettings: () => void;
  closeSettings: () => void;
};

export type ConsentStore = ConsentActions & {
  // null = the customer has not decided yet (or the decision expired)
  consent: CookieConsent | null;
  // The first-layer banner, shown only until a decision is made
  isBannerVisible: boolean;
  isGranted: (category: CookieCategory) => boolean;
};
