import { todayIso } from './dates';
import { newId } from './id';
import { formatGermanNumber } from './money';
import type { Cents, IsoDate } from './types';

export type TravelStatus = 'draft' | 'final';

export interface TravelTrip {
  id: string;
  date: IsoDate;
  address: string;
  orderNumber: string;
  /** One-way distance in km. */
  singleKm: number;
  /** Only confirmed trips count towards the totals. */
  confirmed: boolean;
  /** Optional: name of the customer (printed when the client column is on). */
  client: string;
  /** Optional: travel time in minutes (printed when the duration column is on). */
  durationMinutes: number;
}

export interface TravelStatement {
  id: string;
  status: TravelStatus;
  createdAt: string;
  updatedAt: string;
  startAddress: string;
  /** Rate per kilometre, in cents (30 = 0,30 EUR). */
  ratePerKm: Cents;
  /** Footnote under the table. `{rate}` is replaced by the rate. */
  sourceNote: string;
  showClient: boolean;
  showDuration: boolean;
  trips: TravelTrip[];
}

export interface TravelTotals {
  trips: number;
  confirmed: number;
  /** Round-trip kilometres of confirmed trips. */
  totalKm: number;
  amount: Cents;
  durationMinutes: number;
}

export const DEFAULT_TRAVEL_RATE: Cents = 30;

export const DEFAULT_TRAVEL_SOURCE_NOTE =
  'Entfernungen laut Google Maps (Hin- und Rückfahrt je Auftrag). Betrag = Hin- und Rückfahrt in km × {rate} EUR.';

const roundTenth = (value: number) => Math.round(value * 10) / 10;

export function formatRate(rate: Cents): string {
  return (rate / 100).toFixed(2).replace('.', ',');
}

export function applyRate(template: string, rate: Cents): string {
  return template.split('{rate}').join(formatRate(rate));
}

export function roundTripKm(trip: Pick<TravelTrip, 'singleKm'>): number {
  return roundTenth(trip.singleKm * 2);
}

export function tripAmount(trip: Pick<TravelTrip, 'singleKm'>, ratePerKm: Cents): Cents {
  return Math.round(roundTripKm(trip) * ratePerKm);
}

export function computeTravelTotals(statement: Pick<TravelStatement, 'trips' | 'ratePerKm'>): TravelTotals {
  const confirmed = statement.trips.filter((trip) => trip.confirmed);
  return {
    trips: statement.trips.length,
    confirmed: confirmed.length,
    totalKm: roundTenth(confirmed.reduce((sum, trip) => sum + roundTripKm(trip), 0)),
    amount: confirmed.reduce((sum, trip) => sum + tripAmount(trip, statement.ratePerKm), 0),
    durationMinutes: confirmed.reduce((sum, trip) => sum + trip.durationMinutes, 0),
  };
}

/** `131184` → `1.311,84` (no currency sign, as in the table). */
export function formatDecimal(cents: Cents): string {
  return formatGermanNumber(cents / 100, 2, 2);
}

/** `131184` → `1.311,84 EUR`. */
export function formatEur(cents: Cents): string {
  return `${formatDecimal(cents)} EUR`;
}

/** `2026-10-01` → `01/10/2026`. */
export function formatTravelDate(iso: IsoDate): string {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

export function formatKm(km: number): string {
  return formatGermanNumber(km, 1, 1);
}

/** `85` → `1 Std. 25 Min.`, `40` → `40 Min.`, `0` → empty string. */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest} Min.`;
  return rest === 0 ? `${hours} Std.` : `${hours} Std. ${rest} Min.`;
}

/** `85` → `1:25 h`, for narrow table cells. */
export function formatDurationShort(minutes: number): string {
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return `${hours}:${String(rest).padStart(2, '0')} h`;
}

export function createTrip(previous?: TravelTrip): TravelTrip {
  return {
    id: newId(),
    date: previous?.date ?? todayIso(),
    address: '',
    orderNumber: '',
    singleKm: 0,
    confirmed: true,
    client: '',
    durationMinutes: 0,
  };
}

export function createEmptyTravelStatement(startAddress: string, ratePerKm: Cents): TravelStatement {
  const now = new Date().toISOString();
  return {
    id: newId(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    startAddress,
    ratePerKm,
    sourceNote: DEFAULT_TRAVEL_SOURCE_NOTE,
    showClient: false,
    showDuration: false,
    trips: [createTrip()],
  };
}

/** First and last trip date, for the list. */
export function travelPeriod(statement: Pick<TravelStatement, 'trips'>): { from: IsoDate; to: IsoDate } | null {
  const dates = statement.trips.map((trip) => trip.date).filter(Boolean).sort();
  return dates.length > 0 ? { from: dates[0], to: dates[dates.length - 1] } : null;
}
