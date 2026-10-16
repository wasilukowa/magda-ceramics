import { z } from "zod";

// Model z Vercel AI Gateway. Tani i szybki — tłumaczy krótkie teksty
// o ceramice, nie potrzebuje rozumowania. Zmiana modelu = zmiana tej linii
// (lista: https://ai-gateway.vercel.sh/v1/models).
export const TRANSLATION_MODEL = "anthropic/claude-haiku-5.5";

// Sklep pisze Magda po polsku; tłumaczymy tylko na angielski.
export const TRANSLATED_LOCALE = "en";

export const isTranslatedLocale = (locale?: string): boolean =>
  locale === TRANSLATED_LOCALE;

// Ile tłumaczeń naraz. Pierwsze wejście na listę produktów po wdrożeniu
// tłumaczy cały katalog, a darmowa pula AI Gateway ma limit zapytań na minutę.
export const TRANSLATION_CONCURRENCY = 3;

// Odpowiedź tłumacza po tylu sekundach przestaje być warta czekania — strona
// pokaże wtedy polski tekst i spróbuje znowu przy następnym odświeżeniu.
export const TRANSLATION_TIMEOUT_MS = 20_000;

const STUDIO_CONTEXT =
  "You translate texts for Magda Ceramics, a one-person Polish studio selling handmade stoneware (mugs, espresso cups, bowls, plates, candle holders, small decorative pieces) to customers abroad. Write natural British English, warm and simple, as the maker would write it. Do not add, drop or embellish any information.";

export const PRODUCT_SYSTEM_PROMPT = [
  STUDIO_CONTEXT,
  "You get a product's name, description and short description as JSON and return the same fields in English.",
  "Translate the whole name, including the proper name in quotes: Kubek „Morska Fala” becomes Mug “Sea Wave”. The proper name is an ordinary Polish word or phrase, so translate its meaning and never leave a Polish word in the English name: Miska „Wiśnia” becomes Bowl “Cherry”, and places take their English form: Talerz „Wenecja 2” becomes Plate “Venice 2”. Choose the everyday meaning a shopper would recognise, not pottery jargon.",
  "A czarka is a small handleless bowl, never a mug or a jug: Czarka „Ziemia” becomes Bowl “Earth”. Use the same word in the description.",
  "Put proper names in typographic double quotes “ ”, even when the source has broken or mismatched quote marks or stray spaces. Capitalise only the first word and the proper name: Ceramic swallows, set of 3. Return plain text in the name, without HTML entities.",
  "The descriptions are HTML: keep every tag, attribute and line break exactly as it is and translate only the text between tags. Keep numbers, units and emoji.",
  "An empty field stays empty.",
].join("\n");

export const CATEGORY_SYSTEM_PROMPT = [
  STUDIO_CONTEXT,
  "You get the name of a shop category and return it in English, short, as it would appear in a shop menu (for example „Kubki na espresso” becomes “Espresso mugs”).",
].join("\n");

export const productTextSchema = z.object({
  name: z.string(),
  description: z.string(),
  shortDescription: z.string(),
});

export const categoryNameSchema = z.object({ name: z.string() });

// Jak Promise.all, tylko najwyżej `limit` zadań naraz. Kolejność wyników
// odpowiada kolejności wejścia.
export async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
