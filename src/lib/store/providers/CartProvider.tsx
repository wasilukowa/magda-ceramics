"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { CartStore, CartItem } from "@/lib/store/slices/cartSlice";
import { createLocalStorageStore } from "@/lib/store/localStorageStore";

const CartContext = createContext<CartStore | null>(null);

// Koszyk mieszka w pamięci przeglądarki i to ona jest źródłem prawdy — stąd
// useSyncExternalStore zamiast czytania w efekcie i przepisywania do stanu.
const EMPTY: CartItem[] = [];
const cartStore = createLocalStorageStore<CartItem[]>("cart", EMPTY, (raw) => {
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: Omit<CartItem, "quantity">) => {
    const current = cartStore.read();
    if (current.some((i) => i.id === product.id)) return;
    cartStore.write([...current, { ...product, quantity: 1 }]);
  }, []);

  const removeItem = useCallback((id: number) => {
    cartStore.write(cartStore.read().filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => cartStore.write([]), []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity < 1) return;
    cartStore.write(
      cartStore.read().map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart: () => setIsOpen(true),
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
