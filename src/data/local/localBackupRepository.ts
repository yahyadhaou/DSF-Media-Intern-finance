import { DEFAULT_COMPANY } from '../../domain/defaults';
import type { BackupFile, BackupRepository } from '../ports';
import { migrateCatalog, migrateInvoice } from './legacy';
import {
  exclusive,
  readCatalog,
  readCompany,
  readCounters,
  readInvoices,
  readTravel,
  writeCatalog,
  writeCompany,
  writeCounters,
  writeInvoices,
  writeTravel,
} from './storage';

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== 'object' || value === null) return false;
  const file = value as Partial<BackupFile>;
  return (
    file.version === 1 &&
    Array.isArray(file.invoices) &&
    Array.isArray(file.catalog) &&
    typeof file.company === 'object' &&
    typeof file.counters === 'object'
  );
}

/** Same file format as the web app, so a backup can be moved between the two. */
export const localBackupRepository: BackupRepository = {
  async exportAll() {
    const [invoices, travel, catalog, company, counters] = await Promise.all([
      readInvoices(),
      readTravel(),
      readCatalog(),
      readCompany(),
      readCounters(),
    ]);
    return { version: 1, exportedAt: new Date().toISOString(), invoices, travel, catalog, company, counters };
  },

  importAll(file) {
    return exclusive(async () => {
      if (!isBackupFile(file)) throw new Error('Das ist keine gültige Sicherungsdatei.');
      await writeInvoices(file.invoices.map(migrateInvoice));
      await writeTravel(file.travel ?? []);
      await writeCatalog(migrateCatalog(file.catalog));
      await writeCompany({ ...DEFAULT_COMPANY, ...file.company });
      await writeCounters(file.counters);
    });
  },
};
