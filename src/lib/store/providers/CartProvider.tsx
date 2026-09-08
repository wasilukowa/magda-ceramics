"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { CartStore, CartItem } from "@/contracts/store";
import { createLocalStorageStore } from "@/lib/store/localStorageStore";
import { fetchCartState, parseStoredCart } from "@/lib/helpers/cart";

const CartContext = createContext<CartStore | null>(null);

// Koszyk mieszka w pamięci przeglądarki i to ona jest źródłem prawdy — stąd
// useSyncExternalStore zamiast czytania w efekcie i przepisywania do stanu.
// Każdy zapis czyta pamięć na nowo, więc dwie otwarte karty nie nadpisują
// sobie nawzajem koszyka: karta, która dokłada pracę, dokłada ją do tego, co
// naprawdę leży w pamięci, a nie do swojej starej migawki.
const EMPTY: CartItem[] = [];
const cartStore = createLocalStorageStore<CartItem[]>(
  "cart",
  EMPTY,
  parseStoredCart
);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );
  const [isOpen, setIsOpen] = useState(false);
  // Prace, które zdążyły się sprzedać albo zniknęły ze sklepu, odkąd trafiły
  // do koszyka. NIE usuwamy ich same z siebie — rzecz znikająca z koszyka bez
  // słowa jest gorsza niż rzecz przekreślona z wyjaśnieniem.
  const [soldOutIds, setSoldOutIds] = useState<number[]>([]);

  const addItem = useCallback((product: Omit<CartItem, "quantity">) => {
    const current = cartStore.read();
    // Każda praca istnieje w jednym egzemplarzu, więc drugie kliknięcie nie
    // dokłada sztuki — koszyk po prostu już ją ma.
    if (current.some((i) => i.id === product.id)) return;
    cartStore.write([...current, { ...product, quantity: 1 }]);
  }, []);

  const removeItem = useCallback((id: number) => {
    cartStore.write(cartStore.read().filter((i) => i.id !== id));
    setSoldOutIds((prev) => prev.filter((soldOutId) => soldOutId !== id));
  }, []);

  const clearCart = useCallback(() => {
    cartStore.write([]);
    setSoldOutIds([]);
  }, []);

  // Ceny i dostępność sprawdzone w WooCommerce. Wołane przy otwarciu koszyka,
  // bo dopiero wtedy klient na niego patrzy — a koszyk potrafi poleżeć tydzień.
  const refresh = useCallback(async () => {
    const current = cartStore.read();
    if (current.length === 0) {
      setSoldOutIds([]);
      return;
    }

    const state = await fetchCartState(current.map((item) => item.id));
    if (state.length === 0) return;

    const byId = new Map(state.map((entry) => [entry.id, entry]));

    setSoldOutIds(
      state.filter((entry) => !entry.purchasable).map((entry) => entry.id)
    );

    // Nazwa i cena wracają z serwera, żeby koszyk pokazywał to samo, co kasa
    // policzy przy płatności. Zapis idzie tylko wtedy, gdy coś się naprawdę
    // zmieniło — inaczej każde otwarcie koszyka budziłoby wszystkie karty.
    const refreshed = current.map((item) => {
      const fresh = byId.get(item.id);
      if (!fresh || !fresh.purchasable) return item;
      return {
        ...item,
        name: fresh.name,
        price: fresh.price,
        priceEur: fresh.priceEur,
      };
    });

    if (JSON.stringify(refreshed) !== JSON.stringify(current)) {
      cartStore.write(refreshed);
    }
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
    void refresh();
  }, [refresh]);

  // Suma pomija prace, których i tak nie da się kupić — inaczej klient
  // widziałby kwotę, której nikt od niego nie weźmie.
  const sellableItems = items.filter((i) => !soldOutIds.includes(i.id));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = sellableItems.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        itemCount,
        total,
        soldOutIds,
        addItem,
        removeItem,
        clearCart,
        refresh,
        openCart,
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartStore {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
