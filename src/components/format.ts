import type { Currency } from '../data/cities';

/** Formats whole-currency amounts for a city: symbol first, digit grouping by the city's locale. */
export const makeMoney =
  (currency: Currency) =>
  (n: number): string =>
    `${n < 0 ? '-' : ''}${currency.symbol}${Math.abs(n).toLocaleString(currency.locale)}`;

export type Money = ReturnType<typeof makeMoney>;

export const num = (n: number): string => n.toLocaleString('en-US');
