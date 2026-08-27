"use client";

import { createContext, use, useContext } from "react";

export type AuthUser = {
  id: number;
  email: string;
} | null;

const AuthContext = createContext<Promise<AuthUser> | null>(null);

// Layout NIE czeka na sesję — podaje obietnicę. Gdyby czekał, cała strona
// musiałaby być liczona przy każdym żądaniu (sesja siedzi w ciasteczku, a
// ciasteczka są danymi żądania). Tak skorupa strony prerenderuje się raz, a na
// sesję czeka wyłącznie ten kawałek, który jej naprawdę potrzebuje.
// Po zalogowaniu/wylogowaniu router.refresh() odświeża layout, a z nim obietnicę.
//
// WAŻNE: każdy, kto woła useAuth(), musi mieć nad sobą <Suspense> — inaczej
// zawiesi się cały fragment drzewa aż do najbliższej granicy.
export function AuthProvider({
  userPromise,
  children,
}: {
  userPromise: Promise<AuthUser>;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={userPromise}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthUser {
  const userPromise = useContext(AuthContext);
  if (!userPromise) throw new Error("useAuth must be used inside AuthProvider");
  return use(userPromise);
}
