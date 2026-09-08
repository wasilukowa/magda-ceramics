import { z } from "zod";
import { OrderItem } from "@/contracts/server/cart";
import { ProductProps } from "@/contracts/server/product";
import {
  CheckoutError,
  UnavailableItem,
  UnavailableReason,
} from "@/contracts/server/checkout";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { isCheckoutCountry } from "@/lib/helpers/shipping";

// Sufity na to, co przyjmujemy z przeglądarki. Pracownia sprzedaje pojedyncze
// prace, więc nikt uczciwy się o nie nie obije, a żądanie z tysiącem pozycji
// nie zdąży zmęczyć WooCommerce. Limit pozycji pilnuje przy okazji, żeby zapis
// koszyka zmieścił się w 500 znakach metadanych Stripe'a.
const MAX_CART_LINES = 30;
const MAX_LINE_QUANTITY = 20;
const MAX_FIELD_LENGTH = 120;
const MAX_NOTE_LENGTH = 500;

const text = (max = MAX_FIELD_LENGTH) => z.string().trim().min(1).max(max);

// Z koszyka przysłanego w żądaniu zostają wyłącznie numery produktów i liczba
// sztuk. Cena, nazwa i zdjęcie są tu świadomie odrzucane — te dane czyta się
// z WooCommerce, bo inaczej klient sam dyktuje, ile ma zapłacić.
const cartSchema = z
  .array(
    z.object({
      id: z.int().positive(),
      quantity: z.int().min(1).max(MAX_LINE_QUANTITY),
    })
  )
  .min(1)
  .max(MAX_CART_LINES)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length);

// Kasa pokazuje wyłącznie kraje, do których naprawdę wysyłamy — kod spoza tej
// listy znaczy, że ktoś ominął formularz.
const countrySchema = z.string().refine(isCheckoutCountry);

const billingSchema = z.object({
  first_name: text(),
  last_name: text(),
  email: z.email().max(MAX_FIELD_LENGTH),
  phone: z.string().trim().max(MAX_FIELD_LENGTH).optional().default(""),
  address_1: text(200),
  city: text(),
  postcode: text(20),
  country: countrySchema,
});

const lockerSchema = z.object({
  code: text(50),
  description: z.string().trim().max(200).optional().default(""),
  city: text(),
  postCode: text(20),
});

export const paymentIntentRequestSchema = z.object({
  items: cartSchema,
  country: countrySchema,
  currency: z.enum(Currency),
});

export const availabilityRequestSchema = z.object({ items: cartSchema });

// Waluty ani zapłaconej kwoty tu nie ma — jedno i drugie czytamy ze Stripe'a,
// bo tylko tam jest zapis tego, co klient naprawdę zapłacił.
export const orderRequestSchema = z.object({
  billing: billingSchema,
  items: cartSchema,
  paymentIntentId: z.string().trim().min(1).max(255),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional().default(""),
  deliveryMethod: z.enum(DeliveryMethod).optional(),
  locker: lockerSchema.nullish(),
});

// Pusty koszyk zasługuje na własny komunikat („Twój koszyk jest pusty"), a nie
// na to samo „nieprawidłowe żądanie" co bzdurne dane.
export const getRequestError = (body: unknown): CheckoutError => {
  const items = (body as { items?: unknown })?.items;
  return Array.isArray(items) && items.length === 0
    ? CheckoutError.EmptyCart
    : CheckoutError.InvalidCart;
};

// Kanoniczny zapis koszyka: „12:1,45:2". Posortowany po numerze produktu, żeby
// ten sam koszyk zawsze dawał ten sam ciąg — bez tego o przyjęciu zamówienia
// decydowałaby kolejność pozycji w żądaniu.
export const getCartFingerprint = (items: OrderItem[]): string =>
  [...items]
    .sort((a, b) => a.id - b.id)
    .map((item) => `${item.id}:${item.quantity}`)
    .join(",");

// Pozycje, których nie da się sprzedać: usunięte z WooCommerce, pozbawione
// ceny albo już sprzedane.
export const getUnavailableItems = (
  items: OrderItem[],
  products: ProductProps[]
): UnavailableItem[] => {
  const byId = new Map(products.map((product) => [product.id, product]));

  return items.flatMap<UnavailableItem>((item) => {
    const product = byId.get(item.id);

    if (!product || !product.hasPrice) {
      return [
        {
          id: item.id,
          name: product?.name ?? `#${item.id}`,
          reason: UnavailableReason.Gone,
        },
      ];
    }

    if (!product.inStock) {
      return [
        { id: item.id, name: product.name, reason: UnavailableReason.SoldOut },
      ];
    }

    return [];
  });
};

// Status odpowiedzi dobrany tak, żeby było widać, czyj to problem: 400 —
// żądanie nie trzyma się formularza, 402 — płatności nie da się potwierdzić,
// 409 — praca w międzyczasie zniknęła, 503 — to WooCommerce nie odpowiada.
const STATUS_BY_ERROR: Record<CheckoutError, number> = {
  [CheckoutError.EmptyCart]: 400,
  [CheckoutError.InvalidCart]: 400,
  [CheckoutError.Unavailable]: 409,
  [CheckoutError.CatalogUnavailable]: 503,
  [CheckoutError.PaymentNotVerified]: 402,
  [CheckoutError.OrderFailed]: 500,
};

// Jedna odmowa dla wszystkich tras kasy: kod błędu (nie zdanie — tłumaczy je
// widok) i lista prac, które wypadły.
export const checkoutErrorResponse = (
  error: CheckoutError,
  unavailable: UnavailableItem[] = []
): Response =>
  Response.json(
    unavailable.length ? { error, unavailable } : { error },
    { status: STATUS_BY_ERROR[error] }
  );
