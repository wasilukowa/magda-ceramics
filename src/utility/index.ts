export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isCorrectNumber = (value: unknown): value is number =>
  typeof value === "number" && !isNaN(value) && isFinite(value);

export const isObjectEmpty = (object: object): boolean =>
  Object.keys(object).length === 0;

// Numer telefonu „wygląda na prawdziwy": od 6 do 15 cyfr (15 to limit numeru
// międzynarodowego), plus dowolne spacje, myślniki, nawiasy i „+". Formatu
// kraju nie sprawdzamy — wystarczy, że nikt nie wpisze „-" albo „brak".
export const isPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, "").length;
  return /^[\d\s()+-]+$/.test(value.trim()) && digits >= 6 && digits <= 15;
};
