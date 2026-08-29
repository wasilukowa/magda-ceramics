import { LegalBlockType } from "@/contracts/shared";
import {
  LegalBlock,
  LegalRoute,
  LegalSection,
  LegalTextRun,
} from "@/content/types";

// Konstruktory treści dla dokumentów w content/legal. Bez nich każdy akapit
// byłby ścianą nawiasów klamrowych; z nimi plik z regulaminem czyta się jak
// regulamin. Zwykły tekst podaje się stringiem, wyróżnienia i odnośniki
// owija się w jedną z funkcji poniżej.
type LegalRunInput = string | LegalTextRun;

const toRun = (input: LegalRunInput): LegalTextRun =>
  typeof input === "string" ? { text: input } : input;

const toRuns = (inputs: LegalRunInput[]): LegalTextRun[] => inputs.map(toRun);

export const strong = (text: string): LegalTextRun => ({ text, strong: true });

// Miejsce do uzupełnienia przez Magdę (np. numer konta) — kursywa mówi
// klientowi, że to jeszcze nie jest ostateczna treść.
export const placeholder = (text: string): LegalTextRun => ({ text, italic: true });

export const mail = (address: string): LegalTextRun => ({
  text: address,
  href: `mailto:${address}`,
});

export const link = (
  text: string,
  route: LegalRoute,
  hash?: string
): LegalTextRun => ({ text, route, hash });

export const paragraph = (...content: LegalRunInput[]): LegalBlock => ({
  type: LegalBlockType.Paragraph,
  content: toRuns(content),
});

// Pojedynczy punkt listy to albo goły tekst, albo tablica kawałków, gdy
// zawiera wyróżnienie lub odnośnik.
export const bullets = (
  ...items: Array<LegalRunInput | LegalRunInput[]>
): LegalBlock => ({
  type: LegalBlockType.List,
  items: items.map((item) => toRuns(Array.isArray(item) ? item : [item])),
});

export const section = (
  heading: string,
  ...blocks: LegalBlock[]
): LegalSection => ({ heading, blocks });

// Sekcja z kotwicą w adresie — używana tam, gdzie stopka albo inny dokument
// linkuje wprost do konkretnego paragrafu.
export const anchoredSection = (
  id: string,
  heading: string,
  ...blocks: LegalBlock[]
): LegalSection => ({ id, heading, blocks });
