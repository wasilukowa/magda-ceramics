import { CartItem } from "@/contracts/server/cart";
import {
  CookieCategory,
  ConsentChoices,
  CookieConsent,
  Currency,
} from "@/contracts/shared";

// Kształt stanu, który komponenty dostają przez providery z lib/store.
// Katalog nazywał się kiedyś „slices" — to nazwa z Zustanda, którego w tym
// projekcie nie ma. Sam stan stoi na useSyncExternalStore nad localStorage
// (lib/store/localStorageStore.ts), a same typy należą do kontraktów.
export type { CartItem, Currency };

export type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  // Suma prac, które wciąż da się kupić — sprzedane w międzyczasie nie liczą
  // się do kwoty, choć zostają widoczne w koszyku.
  total: number;
  // Prace sprzedane albo wycofane, odkąd trafiły do koszyka.
  soldOutIds: number[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  // Dociąga z WooCommerce aktualne ceny i dostępność. Nie ma tu
  // `updateQuantity`: każda praca istnieje w jednym egzemplarzu, więc sztuk
  // nie da się dołożyć, a metoda, której nikt nie wołał, mogła kiedyś
  // wpuścić do zamówienia pięć tych samych kubków.
  refresh: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

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

export type CurrencyStore = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

export type WishlistStore = {
  ids: number[];
  count: number;
  isInWishlist: (id: number) => boolean;
  toggle: (id: number) => void;
};
