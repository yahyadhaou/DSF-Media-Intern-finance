import { CLIENT_NAMES, DEFAULT_PLATFORM_FEE_RATE, MIN_MATERIAL_UNIT_PRICE, VAT_RATE } from './constants';
import { todayIso } from './dates';
import { newId } from './id';
import type { CatalogItem, CatalogKind, CompanySettings, Invoice } from './types';

export function createCatalogItem(kind: CatalogKind, existing: CatalogItem[]): CatalogItem {
  const lastPosition = existing.reduce((max, item) => Math.max(max, item.position), -1);
  return {
    id: newId(),
    kind,
    name: '',
    unit: 'Stk',
    unitPrice: kind === 'material' ? MIN_MATERIAL_UNIT_PRICE : 0,
    active: true,
    position: lastPosition + 1,
  };
}

export function createEmptyInvoice(): Invoice {
  const now = new Date().toISOString();
  const today = todayIso();
  return {
    id: newId(),
    number: null,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    issuedAt: null,
    client: { kind: 'telekom', name: CLIENT_NAMES.telekom, street: '', zip: '', city: '' },
    orderNumber: '',
    purchaseOrderNumber: '',
    executionFrom: today,
    executionTo: today,
    owner: { kind: 'private', name: '', street: '', zip: '', city: '', units: 1 },
    showBankDetails: false,
    pricesIncludeVat: true,
    chargeVat: false,
    reverseChargeNote: false,
    platformFee: { days: 0, dailyRate: DEFAULT_PLATFORM_FEE_RATE },
    serviceLines: [],
    materialLines: [],
    vatRate: VAT_RATE,
  };
}

/** New draft that starts with the defaults chosen in the settings. */
export function createInvoiceFromDefaults(company: CompanySettings): Invoice {
  const invoice = createEmptyInvoice();
  return {
    ...invoice,
    pricesIncludeVat: company.pricesIncludeVat,
    chargeVat: company.chargeVatDefault,
    showBankDetails: company.printBankDetails,
    platformFee: { days: 0, dailyRate: company.platformFeeDailyRate || DEFAULT_PLATFORM_FEE_RATE },
  };
}

/** Copy of an existing invoice as a fresh draft (new id, no number, today's date). */
export function duplicateAsDraft(source: Invoice): Invoice {
  const now = new Date().toISOString();
  const today = todayIso();
  return {
    ...source,
    id: newId(),
    number: null,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    issuedAt: null,
    executionFrom: today,
    executionTo: today,
    serviceLines: source.serviceLines.map((line) => ({ ...line, id: newId() })),
    materialLines: source.materialLines.map((line) => ({ ...line, id: newId() })),
  };
}
