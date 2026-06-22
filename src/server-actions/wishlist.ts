"use server";

import { getSession } from "@/lib/auth/dal";
import { customerService } from "@/lib/service/customer";
import { productService } from "@/lib/service/product";
import { ProductProps } from "@/contracts/server/product";

// Zwraca zapisaną listę życzeń zalogowanego klienta (lub null dla gościa).
export async function getServerWishlist(): Promise<number[] | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const customer = await customerService.getCustomerById(session.customerId);
    return customer?.wishlist ?? [];
  } catch (err) {
    console.error("Get server wishlist failed:", err);
    return [];
  }
}

// Zapisuje listę życzeń zalogowanego klienta w WooCommerce.
// Dla gościa zwraca null — wtedy klient trzyma listę w localStorage.
export async function saveWishlist(
  productIds: number[],
): Promise<number[] | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    return await customerService.setWishlist(session.customerId, productIds);
  } catch (err) {
    console.error("Save wishlist failed:", err);
    return null;
  }
}

// Pobiera dane produktów z listy życzeń (lista ID żyje po stronie klienta).
export async function getWishlistProducts(
  ids: number[],
): Promise<ProductProps[]> {
  try {
    return await productService.getProductsByIds(ids);
  } catch (err) {
    console.error("Get wishlist products failed:", err);
    return [];
  }
}
