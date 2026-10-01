"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ServerWishlistStatus,
  WishlistNoticeKind,
  WishlistStore,
} from "@/contracts/store";
import { AuthUser } from "@/lib/store/providers/AuthProvider";
import { saveWishlist, getServerWishlist } from "@/server-actions/wishlist";
import { createLocalStorageStore } from "@/lib/store/localStorageStore";
import { parseStoredIds } from "@/lib/helpers/wishlist";

const WishlistContext = createContext<WishlistStore | null>(null);

const EMPTY: number[] = [];

// Lista gościa mieszka w pamięci przeglądarki. Lista zalogowanego mieszka na
// koncie w WooCommerce — ale JEJ KOPIA leży też tutaj, pod osobnym kluczem.
//
// Kopia nie jest ozdobnikiem. Wcześniej lista zalogowanego siedziała w zwykłym
// stanie Reacta, czyli osobno w każdej karcie przeglądarki, i to gubiło dane:
// karta A polubiła wazon i zapisała [1,2,3], karta B nadal pamiętała [1,2],
// więc jej następne polubienie zapisywało [1,2,4] — wazon znikał z konta bez
// śladu. Wspólna pamięć przeglądarki znosi ten problem u źródła: obie karty
// czytają to samo i widzą swoje zmiany nawzajem.
const guestStore = createLocalStorageStore<number[]>(
  "wishlist",
  EMPTY,
  parseStoredIds
);
const accountStore = createLocalStorageStore<number[]>(
  "wishlist:account",
  EMPTY,
  parseStoredIds
);

// Podpowiedź o zakładaniu konta pokazujemy RAZ na przeglądarkę. Ten sam klucz
// pilnuje, żeby nie wracała przy każdym sercu.
const HINT_SHOWN_KEY = "wishlist:hinted";

const wasHintShown = (): boolean => {
  try {
    return localStorage.getItem(HINT_SHOWN_KEY) === "true";
  } catch {
    return true; // Prywatne okno — lepiej nie pokazywać nic niż w kółko to samo.
  }
};

const rememberHintShown = () => {
  try {
    localStorage.setItem(HINT_SHOWN_KEY, "true");
  } catch {}
};

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
  const accountIds = useSyncExternalStore(
    accountStore.subscribe,
    accountStore.getSnapshot,
    accountStore.getServerSnapshot
  );
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [notice, setNotice] = useState<WishlistNoticeKind | null>(null);

  // Sesja przychodzi obietnicą (patrz AuthProvider). Provider nie może na nią
  // czekać, bo zawiesiłby całą stronę do czasu odczytu ciasteczka — więc
  // startuje jako gość i przełącza się, gdy sesja jest znana.
  useEffect(() => {
    let active = true;
    userPromise.then((user) => {
      if (!active) return;
      setAuthenticated(Boolean(user));
      // Po wylogowaniu kopia listy z konta znika — inaczej mignęłaby przy
      // ponownym zalogowaniu, zanim przyjdzie ta właściwa, a na wspólnym
      // komputerze pokazałaby ulubione poprzedniej osoby.
      if (!user) accountStore.clear();
    });
    return () => {
      active = false;
    };
  }, [userPromise]);

  // Czy kopia listy z konta pochodzi z udanego odczytu w tej wizycie. Dopóki
  // nie, na konto nic nie zapisujemy: zapis zastępuje CAŁĄ listę na koncie,
  // a kopia może być pusta (nowe urządzenie) albo stara.
  const synced = useRef(false);

  // Lista z konta scalona z tym, co gość zdążył polubić. Konto jest źródłem
  // prawdy, więc kopia w przeglądarce jest nadpisywana tym, co przyszło
  // z serwera — bez tego usunięcie ulubionego na innym urządzeniu wracałoby
  // tu jak bumerang. Gdy WordPress nie odpowiada, kopia zostaje, jaka była.
  const syncFromServer = useCallback(
    async (isCurrent: () => boolean = () => true): Promise<boolean> => {
      const result = await getServerWishlist();
      if (!isCurrent() || result.status !== ServerWishlistStatus.Loaded) {
        return false;
      }

      const guest = guestStore.read();
      const merged = Array.from(new Set([...result.ids, ...guest]));
      accountStore.write(merged);
      synced.current = true;

      if (result.ids.length !== merged.length) saveWishlist(merged);
      if (guest.length > 0) guestStore.clear();
      return true;
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated) {
      synced.current = false;
      return;
    }

    let active = true;
    void syncFromServer(() => active);

    return () => {
      active = false;
    };
  }, [isAuthenticated, syncFromServer]);

  const ids = isAuthenticated ? accountIds : guestIds;

  // Numer kolejnego zapisu. Przy szybkim klikaniu odpowiedzi z WooCommerce
  // potrafią wrócić w innej kolejności, niż poszły — cofamy widok tylko wtedy,
  // gdy zawiódł NAJŚWIEŻSZY zapis, a nie jakiś przedawniony.
  const saveToken = useRef(0);

  const toggle = useCallback(
    async (id: number) => {
      // Lista z konta nie wczytała się przy wejściu (np. WordPress nie
      // odpowiadał) — najpierw druga próba. Bez niej serce zapisałoby na koncie
      // kopię, która mogła być pusta, i skasowało resztę ulubionych.
      if (isAuthenticated && !synced.current && !(await syncFromServer())) {
        setNotice(WishlistNoticeKind.SaveFailed);
        return;
      }

      const store = isAuthenticated ? accountStore : guestStore;
      // Czytamy z pamięci, nie ze stanu Reacta: druga karta mogła coś dopisać
      // sekundę temu i jej zmiana nie może zniknąć pod naszą.
      const current = store.read();
      const isAdding = !current.includes(id);
      const next = isAdding ? [...current, id] : current.filter((x) => x !== id);

      store.write(next);

      if (isAuthenticated) {
        const token = ++saveToken.current;
        saveWishlist(next).then((saved) => {
          // `null` znaczy, że WooCommerce nie przyjął zapisu. Cofamy, bo serce
          // świecące na czerwono przy liście, której na koncie nie ma, to
          // gorsze niż uczciwe „nie udało się".
          if (saved === null && token === saveToken.current) {
            store.write(current);
            setNotice(WishlistNoticeKind.SaveFailed);
          }
        });
        return;
      }

      // Gość, który polubił pierwszą pracę, dowiaduje się raz, że bez konta
      // lista zostaje tylko w tej przeglądarce.
      if (isAdding && !wasHintShown()) {
        rememberHintShown();
        setNotice(WishlistNoticeKind.GuestFirstLike);
      }
    },
    [isAuthenticated, syncFromServer]
  );

  const dropMissing = useCallback(
    (existingIds: number[]) => {
      // Bez udanego odczytu z konta nie porządkujemy — patrz `synced`.
      if (isAuthenticated && !synced.current) return;
      const store = isAuthenticated ? accountStore : guestStore;
      const current = store.read();
      const kept = current.filter((id) => existingIds.includes(id));
      if (kept.length === current.length) return;

      store.write(kept);
      if (isAuthenticated) saveWishlist(kept);
    },
    [isAuthenticated]
  );

  const isInWishlist = useCallback((id: number) => ids.includes(id), [ids]);
  const dismissNotice = useCallback(() => setNotice(null), []);

  return (
    <WishlistContext.Provider
      value={{
        ids,
        count: ids.length,
        isInWishlist,
        toggle,
        dropMissing,
        notice,
        dismissNotice,
      }}
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
