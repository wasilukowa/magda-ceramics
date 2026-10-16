import { cacheLife, cacheTag } from "next/cache";
import { serverFetchReadWithRetry } from "@/lib/api";
import {
  RawProduct,
  RawCategory,
  ProductProps,
  CategoryProps,
  CategoryTileProps,
} from "@/contracts/server/product";
import { RawReservingOrder } from "@/contracts/server/order";
import {
  getReservedProductIds,
  pickShopBarCategories,
  prepareProduct,
  prepareCategory,
  PUBLISHED_ONLY,
  UNCATEGORIZED_SLUG,
  withReservations,
} from "./helpers";
import { translationService } from "@/lib/service/translation";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

// Etykieta całego katalogu. Dziś nikt jej nie unieważnia ręcznie — jest po to,
// żeby webhook z WooCommerce mógł kiedyś zrobić `revalidateTag(CATALOG_TAG)`
// i pokazać nową cenę od razu, zamiast czekać na upływ minuty.
export const CATALOG_TAG = "woocommerce-catalog";

const authHeader = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

// Jedyne miejsce, które rozmawia z WooCommerce — i jedyne, które trzeba było
// oznaczyć „use cache". Odpowiedź (czysty JSON) trafia do cache'u Next.js, więc
// katalog wchodzi do statycznej skorupy strony zamiast być liczony przy każdym
// żądaniu. Profil `catalog` (next.config.ts) to dawne `revalidate: 60`, ale
// bez wygasania po godzinie — patrz komentarz przy profilu.
// UWAGA: to musi zostać zwykłą funkcją modułu, nie metodą klasy — „use cache"
// wciąga zmienne z domknięcia do klucza cache'u, a `this` (instancja klasy)
// nie jest serializowalne.
async function wcFetch<T>(endpoint: string): Promise<T> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CATALOG_TAG);

  const res = await serverFetchReadWithRetry(`${WP_URL}/wp-json/wc/v3/${endpoint}`, {
    headers: { Authorization: `Basic ${authHeader}` },
  });
  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// WooCommerce oddaje najwyżej 100 pozycji na jedno zapytanie i nie mówi wprost,
// czy to już wszystko — dopóki strona wraca pełna, pytamy o kolejną. Wcześniej
// sklep prosił sztywno o 20 pozycji, więc dwudziesty pierwszy produkt Magdy nie
// pokazałby się nigdzie: ani w sklepie, ani w kategorii.
const WC_MAX_PER_PAGE = 100;

// Ilu polecanych prac szukamy. Wcześniej pytaliśmy o dokładnie tyle, ile mieści
// sekcja — i to gubiło wybór Magdy: jeśli któraś z pobranych prac nie miała ceny
// albo była już sprzedana, odpadała po pobraniu, a jej miejsce zajmowała
// pierwsza lepsza nowość, choć dalej na liście czekały inne z gwiazdką.
const FEATURED_POOL = 20;

// Bezpiecznik na wypadek, gdyby WooCommerce w kółko oddawał pełne strony —
// tysiąc pozycji to i tak wielokrotnie więcej, niż pracownia kiedykolwiek
// wystawi naraz.
const WC_MAX_PAGES = 10;

async function wcFetchAll<T>(endpoint: string): Promise<T[]> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const collected: T[] = [];

  for (let page = 1; page <= WC_MAX_PAGES; page++) {
    const batch = await wcFetch<T[]>(
      `${endpoint}${separator}per_page=${WC_MAX_PER_PAGE}&page=${page}`
    );
    collected.push(...batch);
    if (batch.length < WC_MAX_PER_PAGE) break;
  }

  return collected;
}

// Produkty bez ceny nie trafiają na stronę — cena jest jedyną rzeczą, bez
// której karta produktu nie ma sensu, a Magda dodaje ją czasem później.
const preparePricedProducts = (raw: RawProduct[]): ProductProps[] =>
  raw.filter((p) => p.price && parseFloat(p.price) > 0).map(prepareProduct);

class ProductService {
  private static instance: ProductService;

  private constructor() {}

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // `locale` przy metodach tego serwisu: w wersji angielskiej nazwy i opisy
  // wracają przetłumaczone (N25, patrz TranslationService). Bez języka —
  // tak, jak je wpisała Magda, po polsku; tak pytają kasa i mapa witryny.
  async getCategories(locale?: string): Promise<CategoryProps[]> {
    const raw = await wcFetchAll<RawCategory>(
      "products/categories?hide_empty=false"
    );
    const categories = raw
      .filter((c) => c.slug !== UNCATEGORIZED_SLUG)
      .map(prepareCategory);
    return translationService.localizeCategories(categories, locale);
  }

  // Categories for the site navigation (menu, footer, homepage tiles): only the
  // ones that actually hold products. A WooCommerce outage must not take the
  // whole layout down with it, so a failed call degrades to an empty menu.
  // Kategorie do menu, stopki i kafelków na stronie głównej. Liczy się to, co
  // jest DO KUPIENIA: licznik z WooCommerce zlicza też sprzedane, więc odkąd
  // sklep ich nie pokazuje, kategoria wyprzedana do zera prowadziłaby z menu
  // na pustą stronę. Obie listy idą z tego samego cache'u, więc to nie jest
  // dodatkowy ruch do WordPressa.
  async getNavigationCategories(locale?: string): Promise<CategoryProps[]> {
    try {
      const [categories, available] = await Promise.all([
        this.getCategories(),
        this.getAvailableProducts(),
      ]);
      const zajete = new Set(
        available.flatMap((product) => product.categories.map((c) => c.id))
      );
      return translationService.localizeCategories(
        categories.filter((category) => zajete.has(category.id)),
        locale
      );
    } catch {
      return [];
    }
  }

  // Pasek kategorii nad siatką sklepu. Te same kategorie co w menu — z pracami
  // do kupienia — żeby sklep i menu nie mówiły różnych rzeczy. Wyjątek: na
  // stronie kategorii, w której zostały już tylko sprzedane prace, ta
  // kategoria zostaje w pasku, żeby było widać, gdzie się jest.
  async getShopBarCategories(locale?: string, activeSlug?: string): Promise<CategoryProps[]> {
    const [all, navigation] = await Promise.all([
      this.getCategories(locale),
      this.getNavigationCategories(locale),
    ]);
    return pickShopBarCategories(all, navigation, activeSlug);
  }

  // Cały katalog (albo cała kategoria), RAZEM ze sprzedanymi — bez sufitu,
  // patrz wcFetchAll. Sklepowi to nie wystarcza (patrz getAvailableProducts),
  // ale archiwum stoi właśnie na tym, co z tej listy odpadło.
  async getProducts(categoryId?: number, locale?: string): Promise<ProductProps[]> {
    const query = categoryId ? `&category=${categoryId}` : "";
    const products = preparePricedProducts(
      await wcFetchAll<RawProduct>(`products?${PUBLISHED_ONLY}${query}`)
    );
    return translationService.localizeProducts(products, locale);
  }

  // To, co naprawdę da się kupić — i tylko to trafia do sklepu. Sprzedane
  // prace mają swoje miejsce w archiwum i nie mieszają się już z ofertą.
  async getAvailableProducts(
    categoryId?: number,
    locale?: string
  ): Promise<ProductProps[]> {
    const products = await this.getProducts(categoryId);
    return translationService.localizeProducts(
      products.filter((product) => product.inStock),
      locale
    );
  }

  // Prace czekające na czyjąś wpłatę (patrz withReservations). Z tego samego
  // cache'u co katalog, więc rezerwacja pojawia się i znika razem z nim.
  // Awaria kończy się pustym zbiorem: zarezerwowana praca na minutę trafi
  // wtedy do archiwum, ale żadna strona przez to nie padnie.
  async getReservedIds(): Promise<Set<number>> {
    try {
      return getReservedProductIds(
        await wcFetch<RawReservingOrder[]>(
          "orders?status=on-hold&per_page=100&_fields=line_items"
        )
      );
    } catch {
      return new Set();
    }
  }

  // Archiwum: prace, które znalazły już właściciela. Ta sama lista, na której
  // stoi sklep — więc Next liczy ją raz — tylko odwrócona: zostaje to, czego
  // nie ma już na stanie. Zarezerwowane tu nie trafiają: do archiwum idą
  // dopiero po wpłacie (decyzja Natalii 2026-10-08). Awaria WooCommerce kończy
  // się pustym archiwum, a nie błędem strony; to galeria, nie sprzedaż, więc
  // nie ma o co kruszyć kopii.
  async getArchivedProducts(locale?: string): Promise<ProductProps[]> {
    try {
      const [products, reservedIds] = await Promise.all([
        this.getProducts(),
        this.getReservedIds(),
      ]);
      return translationService.localizeProducts(
        products.filter((product) => !product.inStock && !reservedIds.has(product.id)),
        locale
      );
    } catch {
      return [];
    }
  }

  // Prace pokazywane na stronie głównej. Wybór należy do Magdy: w WooCommerce
  // wystarczy zaznaczyć przy produkcie gwiazdkę „Polecany".
  //
  // Odkąd sekcja jest karuzelą, wchodzą do niej WSZYSTKIE oznaczone prace, a nie
  // pierwsze cztery — przewijaniem dosięga się reszty. `minimum` mówi tylko, ile
  // kafelków ma się pojawić CO NAJMNIEJ: dopóki gwiazdek jest mniej, resztę
  // dopełniają najnowsze prace, żeby jedna gwiazdka nie dała samotnego kafelka.
  //
  // Zapasowe zapytanie jest tym samym, które wysyła sklep, więc Next liczy je
  // raz. Awaria WooCommerce kończy się pustą sekcją, nie błędem strony głównej.
  async getFeaturedProducts(locale?: string, minimum = 4): Promise<ProductProps[]> {
    try {
      const [featured, newest] = await Promise.all([
        wcFetch<RawProduct[]>(
          `products?${PUBLISHED_ONLY}&featured=true&per_page=${FEATURED_POOL}`
        )
          .then(preparePricedProducts)
          .then((products) => products.filter((p) => p.inStock)),
        this.getAvailableProducts(),
      ]);

      const chosen = [...featured];
      for (const product of newest) {
        if (chosen.length >= minimum) break;
        if (!chosen.some((c) => c.id === product.id)) chosen.push(product);
      }
      return translationService.localizeProducts(chosen, locale);
    } catch {
      return [];
    }
  }

  // Kafelki kategorii ze zdjęciem: strona główna (P10) i podpowiedzi na
  // stronie pustej kategorii. Tylko kategorie, w których jest coś do kupienia
  // (jak w menu), bez tej, na której klient już jest. Zdjęcie to obrazek
  // kategorii z WooCommerce, a bez niego zdjęcie najnowszej dostępnej pracy
  // z tej kategorii — więc kafelek zmienia się sam, kiedy praca się sprzeda.
  // Licznik też liczy tylko dostępne: ten z WooCommerce zlicza sprzedane.
  // Wszystko z cache'u katalogu, bez osobnego zapytania do WordPressa na
  // każdą kategorię. Awaria kończy się brakiem kafelków, nie błędem strony.
  async getCategoryTiles(
    excludeSlug?: string,
    locale?: string
  ): Promise<CategoryTileProps[]> {
    try {
      const [categories, available] = await Promise.all([
        this.getCategories(),
        this.getAvailableProducts(),
      ]);

      const tiles = categories.flatMap((category) => {
        if (category.slug === excludeSlug) return [];
        const products = available.filter((product) =>
          product.categories.some((c) => c.id === category.id)
        );
        if (products.length === 0) return [];
        return [
          {
            ...category,
            count: products.length,
            image: category.image ?? products[0].images[0] ?? null,
          },
        ];
      });
      return translationService.localizeCategories(tiles, locale);
    } catch {
      return [];
    }
  }

  async getProductBySlug(slug: string, locale?: string): Promise<ProductProps | null> {
    const [results, reservedIds] = await Promise.all([
      wcFetch<RawProduct[]>(`products?${PUBLISHED_ONLY}&slug=${slug}`),
      this.getReservedIds(),
    ]);
    if (!results[0]) return null;
    const [product] = await translationService.localizeProducts(
      withReservations([prepareProduct(results[0])], reservedIds),
      locale
    );
    return product;
  }

  async getProductsByIds(ids: number[], locale?: string): Promise<ProductProps[]> {
    if (ids.length === 0) return [];
    const [raw, reservedIds] = await Promise.all([
      wcFetch<RawProduct[]>(
        `products?${PUBLISHED_ONLY}&include=${ids.join(",")}&per_page=${ids.length}`
      ),
      this.getReservedIds(),
    ]);
    return translationService.localizeProducts(
      withReservations(raw.map(prepareProduct), reservedIds),
      locale
    );
  }
}

export const productService = ProductService.getInstance();
