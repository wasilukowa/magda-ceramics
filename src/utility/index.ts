export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isCorrectNumber = (value: unknown): value is number =>
  typeof value === "number" && !isNaN(value) && isFinite(value);

export const isObjectEmpty = (object: object): boolean =>
  Object.keys(object).length === 0;
