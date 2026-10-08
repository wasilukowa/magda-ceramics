"use server";

import { getSession } from "@/lib/auth/dal";
import { customerService } from "@/lib/service/customer";
import { productService } from "@/lib/service/product";
import { ProductProps } from "@/contracts/server/product";
import {
  ServerWishlistResult,
  ServerWishlistStatus,
} from "@/contracts/store";

// Zapisana lista życzeń zalogowanego klienta. Awaria WordPressa to osobny
// wynik, nie pusta lista — patrz ServerWishlistResult.
export async function getServerWishlist(): Promise<ServerWishlistResult> {
  const session = await getSession();
  if (!session) return { status: ServerWishlistStatus.Guest };

  try {
    const customer = await customerService.getCustomerById(session.customerId);
    return { status: ServerWishlistStatus.Loaded, ids: customer?.wishlist ?? [] };
  } catch (err) {
    console.error("Get server wishlist failed:", err);
    return { status: ServerWishlistStatus.Failed };
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
// `null` znaczy „nie udało się zapytać", a nie „nic nie ma" — te dwie rzeczy
// wyglądały wcześniej identycznie i strona pokazywała „Twoja lista ulubionych
// jest pusta" wtedy, gdy WooCommerce po prostu nie odpowiedział na czas.
export async function getWishlistProducts(
  ids: number[],
): Promise<ProductProps[] | null> {
  try {
    // Praca czekająca na czyjąś wpłatę nie pokazuje się nigdzie — ani wśród
    // dostępnych, ani w archiwum (decyzja Natalii 2026-10-08). Wraca do
    // ulubionych sama: jako dostępna albo, po wpłacie, jako sprzedana.
    const products = await productService.getProductsByIds(ids);
    return products.filter((product) => !product.reserved);
  } catch (err) {
    console.error("Get wishlist products failed:", err);
    return null;
  }
}
