import {
  CookieCategory,
  ConsentChoices,
  CookieConsent,
} from "@/contracts/shared";

export type ConsentStore = {
  // null = the customer has not decided yet (or the decision expired)
  consent: CookieConsent | null;
  // The first-layer banner, shown only until a decision is made
  isBannerVisible: boolean;
  // The category panel, opened from the banner or from the footer link
  isSettingsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveChoices: (choices: ConsentChoices) => void;
  openSettings: () => void;
  closeSettings: () => void;
  isGranted: (category: CookieCategory) => boolean;
};
