export const cn = (...classes: Array<string | undefined | null | false | 0>): string =>
  classes.filter(Boolean).join(" ");
