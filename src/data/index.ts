import type { Repositories } from './ports';
import { localBackupRepository } from './local/localBackupRepository';
import { localCatalogRepository } from './local/localCatalogRepository';
import { localInvoiceRepository } from './local/localInvoiceRepository';
import { localSettingsRepository } from './local/localSettingsRepository';
import { localTravelRepository } from './local/localTravelRepository';

/**
 * Composition root: the ONE place that decides where data lives.
 * To use a backend, export an object that implements `Repositories` from here instead.
 */
export const repositories: Repositories = {
  invoices: localInvoiceRepository,
  travel: localTravelRepository,
  catalog: localCatalogRepository,
  settings: localSettingsRepository,
  backup: localBackupRepository,
};
