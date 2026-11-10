import { DEFAULT_PLATFORM_FEE_RATE } from '../../domain/constants';
import { DEFAULT_SERVICES, positionId } from '../../domain/defaults';
import type { CatalogItem, Invoice, InvoiceLine } from '../../domain/types';

/**
 * Converts data saved before the partner position list existed. Handles every
 * older shape, so it is used by the database upgrade and by backup import.
 */

/** Placeholder services from the first version; replaced by the partner positions. */
const isOldPlaceholderService = (id: string | null) => id?.startsWith('svc-') ?? false;

const OLD_MATERIAL_LINKS: Record<string, string> = {
  'mat-duct': positionId('10075520'),
  'mat-cable': positionId('10075542'),
  'mat-splice-protector': positionId('10075572'),
  'mat-cassette': positionId('10060220'),
  'mat-socket': positionId('10060220'),
  'mat-channel': positionId('10075530'),
};

const withCode = (line: InvoiceLine): InvoiceLine => ({ ...line, code: line.code ?? null });

export function migrateInvoice(invoice: Invoice): Invoice {
  const { works: _works, ...rest } = invoice as Invoice & { works?: unknown };
  // Issued invoices keep every line so their totals never change.
  const serviceLines =
    invoice.status === 'draft'
      ? invoice.serviceLines.filter((line) => !isOldPlaceholderService(line.catalogItemId))
      : invoice.serviceLines;
  return {
    ...rest,
    showBankDetails: invoice.showBankDetails ?? false,
    platformFee: invoice.platformFee ?? { days: 0, dailyRate: DEFAULT_PLATFORM_FEE_RATE },
    // Invoices created before the option existed were all charged with VAT.
    chargeVat: invoice.chargeVat ?? true,
    reverseChargeNote: invoice.reverseChargeNote ?? false,
    // Drafts were built from the partner's gross price list; issued invoices keep their original net totals.
    pricesIncludeVat: invoice.pricesIncludeVat ?? invoice.status === 'draft',
    serviceLines: serviceLines.map(withCode),
    materialLines: invoice.materialLines.map(withCode),
  };
}

export function migrateCatalog(items: CatalogItem[]): CatalogItem[] {
  const kept = items
    .filter((item) => !isOldPlaceholderService(item.id))
    .map((item) => {
      const { linkedWork: _linkedWork, ...rest } = item as CatalogItem & { linkedWork?: string };
      return { ...rest, linkedItemId: rest.linkedItemId ?? OLD_MATERIAL_LINKS[item.id] };
    });

  const known = new Set(kept.map((item) => item.id));
  const missingPositions = DEFAULT_SERVICES.filter((item) => !known.has(item.id));

  return [...missingPositions, ...kept]
    .sort((a, b) => Number(b.kind === 'service') - Number(a.kind === 'service'))
    .map((item, position) => ({ ...item, position }));
}
