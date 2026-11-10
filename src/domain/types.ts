/** Money is always stored as integer cents to avoid floating point errors. */
export type Cents = number;
/** Calendar date as `YYYY-MM-DD`. */
export type IsoDate = string;

export type InvoiceStatus = 'draft' | 'issued';
export type ClientKind = 'telekom' | 'vodafone' | 'other';
export type OwnerKind = 'private' | 'company';
/** `Stk` = Stück, `m` = Meter, `15 Min` = quarter-hour rate. */
export type Unit = 'Stk' | 'm' | '15 Min';

export interface Address {
  street: string;
  zip: string;
  city: string;
}

/** The company that orders the work and receives the invoice. */
export interface Client extends Address {
  kind: ClientKind;
  name: string;
}

/** The house owner (private person or company) where the work was done. */
export interface PropertyOwner extends Address {
  kind: OwnerKind;
  name: string;
  /** Wohneinheiten */
  units: number;
}

export interface InvoiceLine {
  id: string;
  /** Catalog entry this line was created from; `null` for free-text lines. */
  catalogItemId: string | null;
  /** Partner position number (Positions-Nr. / OZ); `null` for material and free-text lines. */
  code: string | null;
  description: string;
  quantity: number;
  unit: Unit;
  unitPrice: Cents;
}

export interface PlatformFee {
  /** Number of days; `0` means no fee on this invoice. */
  days: number;
  /** Net rate per day, in cents. */
  dailyRate: Cents;
}

export interface Invoice {
  id: string;
  /** Assigned when the invoice is issued, e.g. `RE-2026-0001`. */
  number: string | null;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  issuedAt: IsoDate | null;

  client: Client;
  orderNumber: string;
  purchaseOrderNumber: string;
  executionFrom: IsoDate;
  executionTo: IsoDate;

  owner: PropertyOwner;

  /** Print the company's bank details on this invoice's PDF. */
  showBankDetails: boolean;
  /** `true`: entered prices already include VAT (brutto); `false`: VAT is added on top (netto). */
  pricesIncludeVat: boolean;
  /** `false`: no VAT is charged (no VAT line, total = net amount). */
  chargeVat: boolean;
  /** Print the § 13b UStG reverse-charge sentence on the PDF. */
  reverseChargeNote: boolean;

  /** Daily platform fee (Ka-sys Platform): printed as a table row, deducted from the net total. */
  platformFee: PlatformFee;

  /** Work billed by partner position. */
  serviceLines: InvoiceLine[];
  /** Material used, with its own unit prices. */
  materialLines: InvoiceLine[];
  vatRate: number;
}

export type CatalogKind = 'service' | 'material';

/** Price list entry. Prices are snapshotted onto invoice lines when used. */
export interface CatalogItem {
  id: string;
  kind: CatalogKind;
  /** Services: partner position number (OZ). */
  code?: string;
  name: string;
  unit: Unit;
  unitPrice: Cents;
  active: boolean;
  /** Display order (ascending). */
  position: number;
  /** Services: show as a quick-add button in the editor. */
  frequent?: boolean;
  /** Materials: suggested quantity = quantity of this service on the invoice. */
  linkedItemId?: string;
}

export interface CompanySettings {
  name: string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  managingDirector: string;
  vatId: string;
  taxNumber: string;
  commercialRegister: string;
  /** Whether each of the three fields above is printed in the PDF footer (off by default). */
  printVatId: boolean;
  printTaxNumber: boolean;
  printCommercialRegister: boolean;

  /** Bank details, printed in their own block after the totals when an invoice opts in. */
  iban: string;
  bic: string;
  /** Bankleitzahl */
  bankCode: string;
  /** Kontonummer */
  accountNumber: string;
  /** Default for the per-invoice "Bankverbindung drucken" switch on new invoices. */
  printBankDetails: boolean;
  /** Default for new invoices: the price list holds gross prices (incl. VAT). */
  pricesIncludeVat: boolean;
  /** Default daily rate of the platform fee on new invoices, in cents. */
  platformFeeDailyRate: Cents;
  /** Default for new invoices: charge VAT (otherwise the total equals the net amount). */
  chargeVatDefault: boolean;
  /** Default rate per kilometre for travel statements, in cents. */
  travelRatePerKm: Cents;
}

export type CompanyPrintKey = 'printVatId' | 'printTaxNumber' | 'printCommercialRegister';

export interface InvoiceTotals {
  /** Sum of service lines as entered (gross or net, see `Invoice.pricesIncludeVat`). */
  servicesAmount: Cents;
  /** Sum of material lines as entered. */
  materialsAmount: Cents;
  /** Platform fee deducted from the net total (net cents, `0` if none). */
  platformFee: Cents;
  net: Cents;
  vat: Cents;
  gross: Cents;
}

/** One highlighted figure in the PDF summary row. */
export interface SummaryTile {
  label: string;
  quantity: number;
  unit: Unit;
}
