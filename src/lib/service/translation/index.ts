import { generateText, Output } from "ai";
import { cacheLife } from "next/cache";
import { ProductProps } from "@/contracts/server/product";
import { ProductText } from "@/contracts/server/translation";
import {
  CATEGORY_SYSTEM_PROMPT,
  PRODUCT_SYSTEM_PROMPT,
  TRANSLATION_CONCURRENCY,
  TRANSLATION_MODEL,
  TRANSLATION_TIMEOUT_MS,
  TRANSLATED_LOCALE,
  categoryNameSchema,
  isTranslatedLocale,
  mapWithLimit,
  productTextSchema,
} from "./helpers";

// N25: Magda pisze produkty po polsku, a wersja angielska tłumaczy je sama.
//
// Tłumaczenie trzymamy we WSPÓLNYM cache'u Vercela („use cache: remote”), a
// kluczem jest sam polski tekst. Model pracuje więc raz na wdrożenie i raz po
// każdej zmianie tekstu w WordPressie — nie przy każdym wejściu klienta ani
// nie na każdej instancji serwera osobno. Zwykłe „use cache” trzyma wpisy
// w pamięci jednej instancji i przy małym ruchu tłumaczyłoby w kółko to samo.
//
// Porażka (brak kredytów, limit zapytań, awaria) daje null i też trafia do
// cache'u, ale tylko na kilka minut (profil `translationRetry`): strona
// pokazuje wtedy polski tekst, a tłumacz dostaje kolejną szansę przy
// następnym odświeżeniu — bez pytania go przy każdym wejściu, gdy leży.
async function translateProductText(source: ProductText): Promise<ProductText | null> {
  "use cache: remote";

  try {
    const { output } = await generateText({
      model: TRANSLATION_MODEL,
      system: PRODUCT_SYSTEM_PROMPT,
      prompt: JSON.stringify(source),
      output: Output.object({ schema: productTextSchema }),
      reasoning: "none",
      maxRetries: 1,
      timeout: TRANSLATION_TIMEOUT_MS,
    });
    cacheLife("translation");
    return output;
  } catch (error) {
    console.error(`Product translation failed (${source.name}):`, describeError(error));
    cacheLife("translationRetry");
    return null;
  }
}

async function translateCategoryName(name: string): Promise<string | null> {
  "use cache: remote";

  try {
    const { output } = await generateText({
      model: TRANSLATION_MODEL,
      system: CATEGORY_SYSTEM_PROMPT,
      prompt: name,
      output: Output.object({ schema: categoryNameSchema }),
      reasoning: "none",
      maxRetries: 1,
      timeout: TRANSLATION_TIMEOUT_MS,
    });
    cacheLife("translation");
    return output.name;
  } catch (error) {
    console.error(`Category translation failed (${name}):`, describeError(error));
    cacheLife("translationRetry");
    return null;
  }
}

// Błąd z AI SDK niesie nagłówki i całą odpowiedź — do logu wystarczy treść.
const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

class TranslationService {
  private static instance: TranslationService;

  private constructor() {}

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // Produkty w języku strony. Po polsku bez zmian. Po angielsku pierwszeństwo
  // mają pola „Nazwa EN” i „Opis EN” wpisane w WordPressie, resztę tłumaczy
  // model, a jeśli zawiedzie — zostaje polski tekst, nigdy błąd strony.
  async localizeProducts(
    products: ProductProps[],
    locale?: string
  ): Promise<ProductProps[]> {
    if (!isTranslatedLocale(locale)) return products;
    return mapWithLimit(products, TRANSLATION_CONCURRENCY, (product) =>
      this.localizeProduct(product)
    );
  }

  // Nazwy kategorii po angielsku. Siedem dzisiejszych ma ręczne tłumaczenia
  // w messages i to one trafiają na stronę (getCategoryLabel) — ta nazwa
  // przydaje się kategorii, którą Magda doda później (decyzja 2026-10-09).
  async localizeCategories<T extends { name: string }>(
    categories: T[],
    locale?: string
  ): Promise<T[]> {
    if (!isTranslatedLocale(locale)) return categories;
    return mapWithLimit(categories, TRANSLATION_CONCURRENCY, async (category) => {
      const name = await this.translateCategory(category.name);
      return name ? { ...category, name } : category;
    });
  }

  private async localizeProduct(product: ProductProps): Promise<ProductProps> {
    const hasManual = Boolean(product.englishName && product.englishDescription);
    const needsMachine = !hasManual || product.shortDescription.trim() !== "";

    const [machine, categories] = await Promise.all([
      needsMachine
        ? this.translateProduct({
            name: product.name,
            description: product.description,
            shortDescription: product.shortDescription,
          })
        : null,
      this.localizeCategories(product.categories, TRANSLATED_LOCALE),
    ]);

    return {
      ...product,
      name: product.englishName || machine?.name || product.name,
      description:
        product.englishDescription || machine?.description || product.description,
      shortDescription: machine?.shortDescription || product.shortDescription,
      categories,
    };
  }

  // Zapas na wypadek błędu samego cache'u — tłumacz łapie swoje błędy sam.
  private async translateProduct(source: ProductText): Promise<ProductText | null> {
    try {
      return await translateProductText(source);
    } catch (error) {
      console.error(`Product translation lookup failed (${source.name}):`, describeError(error));
      return null;
    }
  }

  private async translateCategory(name: string): Promise<string | null> {
    try {
      return await translateCategoryName(name);
    } catch (error) {
      console.error(`Category translation lookup failed (${name}):`, describeError(error));
      return null;
    }
  }
}

export const translationService = TranslationService.getInstance();
