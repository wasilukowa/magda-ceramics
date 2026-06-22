"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { WishlistStore } from "@/lib/store/slices/wishlistSlice";
import { saveWishlist, getServerWishlist } from "@/server-actions/wishlist";

const WishlistContext = createContext<WishlistStore | null>(null);
const STORAGE_KEY = "wishlist";

const readGuestList = (): number[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
};

export function WishlistProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<number[]>([]);
  const initialized = useRef(false);
  // Lustro aktualnej listy — pozwala wyliczyć kolejny stan poza updaterem
  // setState (efekty uboczne nie mogą być wywoływane w trakcie renderu).
  const idsRef = useRef<number[]>(ids);
  idsRef.current = ids;

  // Inicjalizacja: dla gościa lista z localStorage; dla zalogowanego —
  // lista z konta scalona z ewentualną listą gościa (i zapisana).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const guest = readGuestList();

    if (isAuthenticated) {
      getServerWishlist().then((server) => {
        const merged = Array.from(new Set([...(server ?? []), ...guest]));
        setIds(merged);
        if ((server ?? []).length !== merged.length) saveWishlist(merged);
        localStorage.removeItem(STORAGE_KEY); // źródłem prawdy jest konto
      });
    } else {
      setIds(guest);
    }
  }, [isAuthenticated]);

  const persist = useCallback(
    (next: number[]) => {
      if (isAuthenticated) {
        saveWishlist(next);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    },
    [isAuthenticated],
  );

  const toggle = useCallback(
    (id: number) => {
      const prev = idsRef.current;
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      idsRef.current = next;
      setIds(next);
      persist(next); // efekt uboczny w handlerze zdarzenia, poza renderem
    },
    [persist],
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
