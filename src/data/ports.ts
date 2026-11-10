import type { CatalogItem, CompanySettings, Invoice } from '../domain/types';
import type { TravelStatement } from '../domain/travel';

/**
 * The only contract the UI knows about. Everything is async so a real
 * backend (REST, Supabase, ...) can implement the same interfaces later.
 */
export interface InvoiceRepository {
  list(): Promise<Invoice[]>;
  get(id: string): Promise<Invoice | undefined>;
  /** Creates or updates a draft. Issued invoices are immutable and rejected. */
  save(invoice: Invoice): Promise<Invoice>;
  /** Drafts only. */
  delete(id: string): Promise<void>;
  /** Locks the invoice and assigns the next sequential number (a reopened invoice keeps its number). */
  issue(id: string): Promise<Invoice>;
  /** Unlocks an issued invoice for corrections. Number and date stay; issue it again when done. */
  reopen(id: string): Promise<Invoice>;
}

export interface TravelRepository {
  list(): Promise<TravelStatement[]>;
  get(id: string): Promise<TravelStatement | undefined>;
  /** Creates or updates a draft. Finalized statements are immutable and rejected. */
  save(statement: TravelStatement): Promise<TravelStatement>;
  /** Drafts only. */
  delete(id: string): Promise<void>;
  /** Locks the statement. */
  finalize(id: string): Promise<TravelStatement>;
  /** Unlocks a finalized statement so it can be changed again. */
  reopen(id: string): Promise<TravelStatement>;
}

export interface CatalogRepository {
  list(): Promise<CatalogItem[]>;
  save(item: CatalogItem): Promise<CatalogItem>;
  remove(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<CompanySettings>;
  save(settings: CompanySettings): Promise<CompanySettings>;
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  invoices: Invoice[];
  catalog: CatalogItem[];
  company: CompanySettings;
  counters: Record<string, number>;
  /** Absent in backups made before travel statements existed. */
  travel?: TravelStatement[];
}

/** Only needed while data lives in the browser. A backend makes this unnecessary. */
export interface BackupRepository {
  exportAll(): Promise<BackupFile>;
  importAll(file: BackupFile): Promise<void>;
}

export interface Repositories {
  invoices: InvoiceRepository;
  travel: TravelRepository;
  catalog: CatalogRepository;
  settings: SettingsRepository;
  backup?: BackupRepository;
}
