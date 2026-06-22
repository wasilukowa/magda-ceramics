import "server-only";

import { cache } from "react";
import { readSessionCookie } from "@/lib/auth/session";
import { customerService } from "@/lib/service/customer";
import { Customer, SessionPayload } from "@/contracts/server/auth";

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
