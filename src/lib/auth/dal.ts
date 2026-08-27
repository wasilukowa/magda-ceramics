import "server-only";

import { cache } from "react";
import { readSessionCookie } from "@/lib/auth/session";
import { customerService } from "@/lib/service/customer";
import { Customer, SessionPayload } from "@/contracts/server/auth";
import { AuthUser } from "@/lib/store/providers/AuthProvider";

// Memoizowane na jeden render — wiele komponentów może wołać bez duplikowania
// odczytu ciasteczka / zapytania do WooCommerce.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  return readSessionCookie();
});

export const getCurrentCustomer = cache(async (): Promise<Customer | null> => {
  const session = await getSession();
  if (!session) return null;
  return customerService.getCustomerById(session.customerId);
});

// Sesja w postaci, której potrzebuje warstwa UI. Layout podaje tę obietnicę
// providerowi bez czekania na nią — dzięki temu odczyt ciasteczka nie odbiera
// stronie statyczności; patrz AuthProvider.
export const getAuthUser = cache(async (): Promise<AuthUser> => {
  const session = await getSession();
  return session ? { id: session.customerId, email: session.email } : null;
});
