import { z } from "zod";
import { OrderItem } from "@/contracts/server/cart";
import { ProductProps } from "@/contracts/server/product";
import {
  CheckoutError,
  DeliveryDetails,
  DeliveryFields,
  UnavailableItem,
  UnavailableReason,
} from "@/contracts/server/checkout";
import { DeliveryMethod } from "@/contracts/server/shipping";
import { Currency } from "@/contracts/shared";
import { getShippingCostInZloty, isCheckoutCountry } from "@/lib/helpers/shipping";
import { LOCKER_NOTE_PREFIX } from "@/lib/service/order/helpers";
import { routing } from "@/i18n/routing";
import { isPhoneNumber } from "@/utility";

// Sufity na to, co przyjmujemy z przeglądarki. Pracownia sprzedaje pojedyncze
// prace, więc nikt uczciwy się o nie nie obije, a żądanie z tysiącem pozycji
// nie zdąży zmęczyć WooCommerce.
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
  address_2: z.string().trim().max(200).optional().default(""),
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

// Numer płatności z adresu, na który Stripe odsyła klienta. Mówi tylko,
// KTÓRĄ płatność sprawdzić — co z nią, rozstrzyga Stripe. „Client secret"
// (też z adresu powrotu) dowodzi, że pyta przeglądarka, która płaciła —
// tylko jej oddajemy klucz zamówienia po nieudanej płatności.
export const completeOrderRequestSchema = z.object({
  paymentIntentId: z.string().trim().min(1).max(255),
  clientSecret: z.string().trim().min(1).max(255).optional(),
});

const deliveryFields = {
  billing: billingSchema,
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional().default(""),
  deliveryMethod: z.enum(DeliveryMethod).optional(),
  locker: lockerSchema.nullish(),
};

// Do paczkomatu telefon jest obowiązkowy: InPost wysyła na niego SMS
// z kodem odbioru. Kasa pilnuje tego sama, to jest zabezpieczenie na
// żądanie złożone z pominięciem formularza.
const hasLockerPhone = ({
  deliveryMethod,
  locker,
  billing,
}: {
  deliveryMethod?: DeliveryMethod;
  locker?: unknown;
  billing: { phone: string };
}): boolean =>
  deliveryMethod !== DeliveryMethod.Locker || !locker || isPhoneNumber(billing.phone);

// „Złóż zamówienie". Waluta przychodzi z kasy, ale kwoty nie ma — tę liczy
// WooCommerce z numerów produktów, a wysyłkę serwer z cennika.
export const placeOrderRequestSchema = z
  .object({
    ...deliveryFields,
    items: cartSchema,
    currency: z.enum(Currency),
    checkoutId: z.uuid(),
    // Język strony, na której klient zamawia — w nim dostanie maile. Opcjonalny,
    // bo karta otwarta przed wdrożeniem go nie wysyła; wtedy język idzie
    // z kraju adresu.
    locale: z.enum(routing.locales).optional(),
  })
  .refine(hasLockerPhone, { path: ["billing", "phone"] });

// „Zapisz zmiany" — poprawka złożonego, nieopłaconego zamówienia.
export const updateOrderRequestSchema = z
  .object({
    ...deliveryFields,
    orderId: z.int().positive(),
    key: z.string().trim().min(1).max(64),
  })
  .refine(hasLockerPhone, { path: ["billing", "phone"] });

// Pusty koszyk zasługuje na własny komunikat („Twój koszyk jest pusty"), a nie
// na to samo „nieprawidłowe żądanie" co bzdurne dane.
export const getRequestError = (body: unknown): CheckoutError => {
  const items = (body as { items?: unknown })?.items;
  return Array.isArray(items) && items.length === 0
    ? CheckoutError.EmptyCart
    : CheckoutError.InvalidCart;
};

// Pozycje, których nie da się sprzedać: usunięte z WooCommerce, pozbawione
// ceny, zarezerwowane w czyimś złożonym zamówieniu albo już sprzedane.
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
        {
          id: item.id,
          name: product.name,
          reason: product.reserved ? UnavailableReason.Reserved : UnavailableReason.SoldOut,
        },
      ];
    }

    return [];
  });
};

// Status odpowiedzi dobrany tak, żeby było widać, czyj to problem: 400 —
// żądanie nie trzyma się formularza, 402 — płatności nie da się potwierdzić,
// 409 — praca w międzyczasie zniknęła albo zamówienia nie da się już
// poprawić, 429 — za dużo prób z jednego miejsca,
// 503 — to WooCommerce nie odpowiada.
const STATUS_BY_ERROR: Record<CheckoutError, number> = {
  [CheckoutError.EmptyCart]: 400,
  [CheckoutError.InvalidCart]: 400,
  [CheckoutError.Unavailable]: 409,
  [CheckoutError.CatalogUnavailable]: 503,
  [CheckoutError.PaymentNotVerified]: 402,
  [CheckoutError.OrderFailed]: 500,
  [CheckoutError.TooManyAttempts]: 429,
  [CheckoutError.OrderNotEditable]: 409,
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

// Adres, wysyłka i uwagi w kształcie zamówienia WooCommerce — przy składaniu
// i przy poprawce. Wysyłkę liczymy z cennika dla kraju adresu i sposobu
// dostawy, nie z kwoty z żądania. Sposób dostawy przychodzi tu już
// rozstrzygnięty (resolveDeliveryMethod).
//
// Zamówienie do paczkomatu (Polska i kraje InPost International) idzie na
// adres paczkomatu, a linia wysyłki niesie jego kod, żeby pracownia
// wiedziała, dokąd nadać. W uwagach klienta ląduje tylko to, co może
// przeczytać w swoim mailu: jego własna uwaga i wybrany paczkomat. Uwagi dla
// Magdy idą osobno, jako notatki prywatne — patrz OrderService.
export const getDeliveryFields = ({
  billing,
  note,
  deliveryMethod,
  locker,
}: DeliveryDetails): DeliveryFields => {
  const isLocker = deliveryMethod === DeliveryMethod.Locker && !!locker;
  const shipping = isLocker
    ? {
        ...billing,
        company: `Paczkomat ${locker.code}`,
        address_1: locker.description || locker.code,
        address_2: "",
        city: locker.city,
        postcode: locker.postCode,
      }
    : billing;

  const noteParts: string[] = [];
  if (note) noteParts.push(note);
  if (isLocker) {
    noteParts.push(
      `${LOCKER_NOTE_PREFIX}${locker.code}${
        locker.description ? ` (${locker.description})` : ""
      }`
    );
  }

  return {
    billing,
    shipping,
    shippingLine: {
      method_id: "flat_rate",
      method_title: isLocker ? `Paczkomat InPost ${locker.code}` : "Shipping",
      total: getShippingCostInZloty(billing.country, deliveryMethod).toFixed(2),
    },
    customerNote: noteParts.join("\n"),
    lockerCode: isLocker ? locker.code : null,
  };
};
