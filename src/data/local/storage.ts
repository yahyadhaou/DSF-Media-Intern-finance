import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CATALOG, DEFAULT_COMPANY } from '../../domain/defaults';
import type { CatalogItem, CompanySettings, Invoice } from '../../domain/types';
import type { TravelStatement } from '../../domain/travel';

/** Storage keys. Each collection is one JSON document: simple, atomic per write, and tiny for a small business. */
export const KEYS = {
  invoices: 'dsf:invoices',
  travel: 'dsf:travel',
  catalog: 'dsf:catalog',
  company: 'dsf:company',
  counters: 'dsf:counters',
  seeded: 'dsf:seeded',
} as const;

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/**
 * Runs tasks one after another. Read-modify-write cycles (saving a draft, issuing
 * the next invoice number) must not interleave, otherwise two quick taps could
 * hand out the same number or overwrite each other.
 */
let queue: Promise<unknown> = Promise.resolve();
export function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export const readInvoices = () => readJson<Invoice[]>(KEYS.invoices, []);
export const writeInvoices = (invoices: Invoice[]) => writeJson(KEYS.invoices, invoices);
export const readTravel = () => readJson<TravelStatement[]>(KEYS.travel, []);
export const writeTravel = (statements: TravelStatement[]) => writeJson(KEYS.travel, statements);
export const readCounters = () => readJson<Record<string, number>>(KEYS.counters, {});
export const writeCounters = (counters: Record<string, number>) => writeJson(KEYS.counters, counters);

let seeding: Promise<void> | null = null;

/** Fills the price list and company data on the very first start. Runs only once. */
export function ensureSeeded(): Promise<void> {
  seeding ??= (async () => {
    if ((await AsyncStorage.getItem(KEYS.seeded)) !== null) return;
    await writeJson(KEYS.catalog, DEFAULT_CATALOG);
    await writeJson(KEYS.company, DEFAULT_COMPANY);
    await AsyncStorage.setItem(KEYS.seeded, '1');
  })().catch((error) => {
    seeding = null;
    throw error;
  });
  return seeding;
}

export async function readCatalog(): Promise<CatalogItem[]> {
  await ensureSeeded();
  const items = await readJson<CatalogItem[]>(KEYS.catalog, []);
  return [...items].sort((a, b) => a.position - b.position);
}

export const writeCatalog = (items: CatalogItem[]) => writeJson(KEYS.catalog, items);

export async function readCompany(): Promise<CompanySettings> {
  await ensureSeeded();
  // Merging with defaults gives older saves the "off" values of settings added later.
  return { ...DEFAULT_COMPANY, ...(await readJson<Partial<CompanySettings>>(KEYS.company, {})) };
}

export const writeCompany = (company: CompanySettings) => writeJson(KEYS.company, company);

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  seeding = null;
}
