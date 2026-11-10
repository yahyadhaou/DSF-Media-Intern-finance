import type { Cents } from './types';

/**
 * German number formatting without `Intl`: Hermes (React Native) does not ship
 * every locale on every device, and the PDF must look the same everywhere.
 */
export function formatGermanNumber(value: number, minDecimals: number, maxDecimals: number): string {
  const negative = value < 0;
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(Math.abs(value) * factor) / factor;
  let [whole, fraction = ''] = rounded.toFixed(maxDecimals).split('.');
  while (fraction.length > minDecimals && fraction.endsWith('0')) fraction = fraction.slice(0, -1);
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const text = fraction ? `${whole},${fraction}` : whole;
  return negative && rounded !== 0 ? `-${text}` : text;
}

export function eurosToCents(euros: number): Cents {
  return Math.round(euros * 100);
}

/** `131184` → `1.311,84 €` (non-breaking space, like the browser's de-DE currency format). */
export function formatEuro(cents: Cents): string {
  return `${formatGermanNumber(cents / 100, 2, 2)} €`;
}

export function formatQuantity(quantity: number): string {
  return formatGermanNumber(quantity, 0, 2);
}

/** Parses user input like `12,5` or `12.5`. Returns `0` for anything invalid. */
export function parseDecimal(text: string): number {
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

/** Cents → text for an input field: `4578` → `45,78`. */
export function centsToInput(cents: Cents): string {
  return formatGermanNumber(cents / 100, 2, 2).replace(/\./g, '');
}

/** Number → text for an input field: `12.5` → `12,5`, `0` → empty. */
export function numberToInput(value: number): string {
  return value === 0 ? '' : String(value).replace('.', ',');
}
