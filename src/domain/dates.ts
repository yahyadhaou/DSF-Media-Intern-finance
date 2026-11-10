import type { IsoDate } from './types';

const pad = (value: number) => String(value).padStart(2, '0');

/** Converts a `Date` to `YYYY-MM-DD` in local time. */
export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → local `Date` at noon (avoids time-zone day shifts). */
export function fromIsoDate(iso: IsoDate): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12) : new Date();
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function formatDate(iso: IsoDate): string {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}.${month}.${year}` : iso;
}

export function formatPeriod(from: IsoDate, to: IsoDate): string {
  if (!from && !to) return '';
  if (!to || from === to) return formatDate(from);
  return `${formatDate(from)} – ${formatDate(to)}`;
}
