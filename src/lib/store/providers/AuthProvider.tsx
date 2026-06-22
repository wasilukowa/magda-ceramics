"use client";

import { createContext, useContext } from "react";

export type AuthUser = {
  id: number;
  email: string;
} | null;

const AuthContext = createContext<AuthUser>(null);

// Wartość pochodzi z serwera (layout czyta sesję z ciasteczka — bez zapytań
// sieciowych). Po zalogowaniu/wylogowaniu router.refresh() odświeża layout,
// a tym samym przekazaną tu wartość.
export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthUser {
  return useContext(AuthContext);
}
