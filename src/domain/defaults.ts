import { DEFAULT_PLATFORM_FEE_RATE } from './constants';
import { eurosToCents } from './money';
import type { CatalogItem, CompanySettings, Unit } from './types';

type PartnerPosition = [code: string, name: string, unit: Unit, euros: number];

/** Partner price table 2026 (OZ, Kurztext, Einheit, Preis). */
const PARTNER_POSITIONS: PartnerPosition[] = [
  ['10060182', 'OneBox Setzen', 'Stk', 19.64],
  ['10060209', 'GWV Basismodul', 'Stk', 83.17],
  ['10060210', 'nicht erledigt – Connect Auftrag', 'Stk', 30.0],
  ['10060212', 'nicht erledigt - Abbruch GWV', 'Stk', 78.0],
  ['10060216', 'NE 5 – FTTH', 'Stk', 45.82],
  ['10060218', 'NE5 FTTH mit Anfahrt', 'Stk', 52.37],
  ['10072109', 'NE 5 - Small', 'Stk', 13.1],
  ['10072119', 'NE 5 - Medium', 'Stk', 19.81],
  ['10072129', 'NE 5 - Large', 'Stk', 21.85],
  ['10072139', 'NE 5 - Extra Large', 'Stk', 30.65],
  ['10072149', 'NE 5 - Installation S', 'Stk', 35.18],
  ['10072159', 'NE 5 - Installation M', 'Stk', 51.71],
  ['10072459', 'FTTH - Stundensatz FTTH', '15 Min', 9.82],
  ['10075520', 'Kunststoff-Rohr-/Kabelkanalnetzausbau', 'm', 4.78],
  ['10075542', 'Gf-Kabel einziehen/einblasen u. verlegen', 'm', 2.29],
  ['10075572', 'Zusätzliche Gf-Spleiße herstellen', 'Stk', 10.51],
  ['10075642', 'Montage Gf-GV', 'Stk', 13.09],
  ['10075739', 'Brandschottung herstellen 5cm x 5cm', 'Stk', 29.46],
  ['10075741', 'Entstörung NE3 bei FTTx-Anschlüsse', 'Stk', 19.64],
  ['10075742', 'Decken-/Wanddurchbruch herstellen >40 mm', 'Stk', 27.49],
  ['10075744', 'Teilerledigung Auskundung bei FTTx', 'Stk', 19.64],
  ['10060202', 'Gf-TA Connect Only', 'Stk', 38.63],
  ['10060220', 'Herstellen Connect FTTH mit NE4', 'Stk', 78.6],
  ['10060221', 'Herstellen BULK Connect FTTH mit NE4', 'Stk', 45.67],
  ['10060222', 'nicht erledigt - Connect BULK', 'Stk', 15.0],
  ['10060223', 'Problembehebung FTTH-Anschluss', 'Stk', 32.74],
  ['10060224', 'Teilerl. PB FTTH-AS/Connect-Only', 'Stk', 15.71],
  ['10060225', 'Einbau/Schaltung Gf-Koppler - FTTx-AS', 'Stk', 32.74],
  ['10060226', 'VOA FTTH – Small', 'Stk', 68.75],
  ['10060227', 'VOA FTTH – Standard', 'Stk', 88.4],
  ['10060228', 'VOA FTTH – Large', 'Stk', 108.04],
  ['10060229', 'Montage Gf-SP (klassisch)', 'Stk', 25.21],
  ['10060230', 'Montage Gf-SP (vorkonf.)', 'Stk', 13.1],
  ['10060231', 'Kleiner Decken-/Wanddurchbruch', 'Stk', 20.95],
  ['10060232', 'Mini-GWV Basismodul', 'Stk', 11.13],
  ['10060233', 'Montage Metallhaube', 'Stk', 7.2],
  ['10075530', 'Metall-Rohr-/Kabelkanalnetzausbau', 'm', 9.17],
];

/** Positions that show up as quick-add buttons in the editor. */
const FREQUENT_CODES = new Set([
  '10060202',
  '10060210',
  '10060220',
  '10060221',
  '10060222',
  '10060231',
  '10075520',
  '10075530',
  '10075542',
  '10075572',
  '10075741',
]);

export const positionId = (code: string) => `pos-${code}`;

export const DEFAULT_SERVICES: CatalogItem[] = PARTNER_POSITIONS.map(([code, name, unit, euros], position) => ({
  id: positionId(code),
  kind: 'service',
  code,
  name,
  unit,
  unitPrice: eurosToCents(euros),
  active: true,
  position,
  frequent: FREQUENT_CODES.has(code),
}));

type MaterialSeed = Omit<CatalogItem, 'kind' | 'active' | 'position'>;

/** Starting prices for own material. Placeholders: replace with real purchase prices in the app. */
const MATERIAL_SEED: MaterialSeed[] = [
  { id: 'mat-duct', name: 'Leerrohr', unit: 'm', unitPrice: 60, linkedItemId: positionId('10075520') },
  { id: 'mat-cable', name: 'Glasfaser-Mikrokabel', unit: 'm', unitPrice: 85, linkedItemId: positionId('10075542') },
  { id: 'mat-splice-protector', name: 'Spleißschutz (Schrumpf)', unit: 'Stk', unitPrice: 60, linkedItemId: positionId('10075572') },
  { id: 'mat-cassette', name: 'Spleißkassette (12 Fasern)', unit: 'Stk', unitPrice: 480, linkedItemId: positionId('10060220') },
  { id: 'mat-socket', name: 'Glasfaserdose GF-TA', unit: 'Stk', unitPrice: 1450, linkedItemId: positionId('10060220') },
  { id: 'mat-channel', name: 'Metallkanal (Alu)', unit: 'm', unitPrice: 590, linkedItemId: positionId('10075530') },
];

export const DEFAULT_MATERIALS: CatalogItem[] = MATERIAL_SEED.map((item, index) => ({
  ...item,
  kind: 'material',
  active: true,
  position: DEFAULT_SERVICES.length + index,
}));

export const DEFAULT_CATALOG: CatalogItem[] = [...DEFAULT_SERVICES, ...DEFAULT_MATERIALS];

export const DEFAULT_COMPANY: CompanySettings = {
  name: 'DSF Media',
  street: 'Reuenberg 67',
  zip: '45357',
  city: 'Essen',
  phone: '+49 162 686 1853',
  email: 'abdel.dhaou@icloud.com',
  website: 'dsf-media.netlify.app',
  managingDirector: 'Dhaou Abdelkader',
  vatId: '',
  taxNumber: '',
  commercialRegister: '',
  printVatId: false,
  printTaxNumber: false,
  printCommercialRegister: false,
  iban: '',
  bic: '',
  bankCode: '',
  accountNumber: '',
  printBankDetails: false,
  pricesIncludeVat: true,
  platformFeeDailyRate: DEFAULT_PLATFORM_FEE_RATE,
  chargeVatDefault: false,
  travelRatePerKm: 30,
};
