import { computeTotals, summaryTiles } from './calc';
import { roundTripKm, tripAmount, type TravelStatement } from './travel';
import type { Cents, Invoice, Unit } from './types';

/** `YYYY-MM` */
export type MonthKey = string;

export interface QuantityStat {
  label: string;
  quantity: number;
  unit: Unit;
}

/** Everything that happened in one calendar month. */
export interface MonthStats {
  key: MonthKey;
  /** Issued invoices (incl. ones reopened for a correction, they keep their number). */
  issued: number;
  /** Drafts without a number yet. */
  drafts: number;
  /** Net / gross of the issued invoices. */
  net: Cents;
  gross: Cents;
  /** Gross of the drafts: work that is not invoiced yet. */
  openGross: Cents;
  /** Highlighted work figures (cable metres, connects, …) of all invoices in this month. */
  quantities: QuantityStat[];
  /** Confirmed trips, round-trip km and travel amount, by trip date. */
  trips: number;
  km: number;
  travelAmount: Cents;
}

export const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** `2026-10` → `Oktober 2026` */
export function monthLabel(key: MonthKey): string {
  const [year, month] = key.split('-').map(Number);
  return `${MONTH_NAMES[month - 1] ?? ''} ${year}`;
}

/** An invoice counts for the month its work was done in (Leistungszeitraum „von“). */
function invoiceMonth(invoice: Invoice): MonthKey {
  return (invoice.executionFrom || invoice.issuedAt || invoice.createdAt).slice(0, 7);
}

const roundTenth = (value: number) => Math.round(value * 10) / 10;

function emptyMonth(key: MonthKey): MonthStats {
  return { key, issued: 0, drafts: 0, net: 0, gross: 0, openGross: 0, quantities: [], trips: 0, km: 0, travelAmount: 0 };
}

/** Month-by-month figures, newest month first. Only months with at least one invoice or trip are listed. */
export function monthlyStats(invoices: Invoice[], statements: TravelStatement[]): MonthStats[] {
  const months = new Map<MonthKey, MonthStats>();
  const month = (key: MonthKey) => {
    let entry = months.get(key);
    if (!entry) months.set(key, (entry = emptyMonth(key)));
    return entry;
  };

  for (const invoice of invoices) {
    const entry = month(invoiceMonth(invoice));
    const totals = computeTotals(invoice);
    if (invoice.number) {
      entry.issued += 1;
      entry.net += totals.net;
      entry.gross += totals.gross;
    } else {
      entry.drafts += 1;
      entry.openGross += totals.gross;
    }
    for (const tile of summaryTiles(invoice.serviceLines)) {
      const existing = entry.quantities.find((q) => q.label === tile.label);
      if (existing) existing.quantity += tile.quantity;
      else entry.quantities.push({ ...tile });
    }
  }

  for (const statement of statements) {
    for (const trip of statement.trips) {
      if (!trip.confirmed || !trip.date) continue;
      const entry = month(trip.date.slice(0, 7));
      entry.trips += 1;
      entry.km = roundTenth(entry.km + roundTripKm(trip));
      entry.travelAmount += tripAmount(trip, statement.ratePerKm);
    }
  }

  return [...months.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export interface YearStats {
  year: number;
  issued: number;
  drafts: number;
  net: Cents;
  openGross: Cents;
  trips: number;
  km: number;
  travelAmount: Cents;
  /** Net per month, January … December. */
  netByMonth: Cents[];
}

export function yearStats(months: MonthStats[], year: number): YearStats {
  const result: YearStats = { year, issued: 0, drafts: 0, net: 0, openGross: 0, trips: 0, km: 0, travelAmount: 0, netByMonth: Array(12).fill(0) };
  for (const entry of months) {
    const [entryYear, entryMonth] = entry.key.split('-').map(Number);
    if (entryYear !== year) continue;
    result.issued += entry.issued;
    result.drafts += entry.drafts;
    result.net += entry.net;
    result.openGross += entry.openGross;
    result.trips += entry.trips;
    result.km = roundTenth(result.km + entry.km);
    result.travelAmount += entry.travelAmount;
    result.netByMonth[entryMonth - 1] += entry.net;
  }
  return result;
}

/** Years that have data, newest first; always contains the current year. */
export function availableYears(months: MonthStats[], currentYear: number): number[] {
  const years = new Set<number>([currentYear, ...months.map((entry) => Number(entry.key.slice(0, 4)))]);
  return [...years].filter((year) => year > 2000).sort((a, b) => b - a);
}
