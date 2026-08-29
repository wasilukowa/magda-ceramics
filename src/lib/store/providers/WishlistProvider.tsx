"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { WishlistStore } from "@/contracts/store";
import { AuthUser } from "@/lib/store/providers/AuthProvider";
import { saveWishlist, getServerWishlist } from "@/server-actions/wishlist";
import { createLocalStorageStore } from "@/lib/store/localStorageStore";

const WishlistContext = createContext<WishlistStore | null>(null);
const STORAGE_KEY = "wishlist";

// Lista gościa mieszka w pamięci przeglądarki; dla zalogowanego źródłem prawdy
// jest konto, więc te dwa stany trzymamy osobno i wybieramy jeden przy
// renderze. Dzięki temu żaden z nich nie musi być przepisywany w efekcie.
const EMPTY: number[] = [];
const guestStore = createLocalStorageStore<number[]>(
  STORAGE_KEY,
  EMPTY,
  (raw) => {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : EMPTY;
  }
);

export function WishlistProvider({
  userPromise,
  children,
}: {
  userPromise: Promise<AuthUser>;
  children: React.ReactNode;
}) {
  const guestIds = useSyncExternalStore(
    guestStore.subscribe,
    guestStore.getSnapshot,
    guestStore.getServerSnapshot
  );
  const [accountIds, setAccountIds] = useState<number[]>(EMPTY);
  const [isAuthenticated, setAuthenticated] = useState(false);

  // Sesja przychodzi obietnicą (patrz AuthProvider). Provider nie może na nią
  // czekać, bo zawiesiłby całą stronę do czasu odczytu ciasteczka — więc
  // startuje jako gość i przełącza się, gdy sesja jest znana. Serce przy
  // produkcie i tak zapala się dopiero po pobraniu listy z konta.
  useEffect(() => {
    let active = true;
    userPromise.then((user) => {
      if (!active) return;
      setAuthenticated(Boolean(user));
      // Po wylogowaniu lista z konta znika — inaczej mignęłaby przy ponownym
      // zalogowaniu, zanim przyjdzie ta właściwa. (Wcześniej robił to `key`
      // na providerze, który wymuszał przemontowanie.)
      if (!user) setAccountIds(EMPTY);
    });
    return () => {
      active = false;
    };
  }, [userPromise]);

  // Po zalogowaniu: lista z konta scalona z tym, co gość zdążył polubić.
  // setState siedzi w odpowiedzi serwera, nie w ciele efektu.
  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    getServerWishlist().then((server) => {
      if (!active) return;

      const guest = guestStore.read();
      const merged = Array.from(new Set([...(server ?? []), ...guest]));
      setAccountIds(merged);

      if ((server ?? []).length !== merged.length) saveWishlist(merged);
      if (guest.length > 0) guestStore.clear(); // źródłem prawdy jest konto
    });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const ids = isAuthenticated ? accountIds : guestIds;

  const toggle = useCallback(
    (id: number) => {
      const current = isAuthenticated ? accountIds : guestStore.read();
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];

      if (isAuthenticated) {
        setAccountIds(next);
        saveWishlist(next);
      } else {
        guestStore.write(next);
      }
    },
    [isAuthenticated, accountIds]
  );

  const isInWishlist = useCallback((id: number) => ids.includes(id), [ids]);

  return (
    <WishlistContext.Provider
      value={{ ids, count: ids.length, isInWishlist, toggle }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistStore {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
