import type { ClientKind } from './types';

export const VAT_RATE = 0.19;

/** Name of the daily platform fee that is deducted from the invoice total. */
export const PLATFORM_FEE_LABEL = 'Ka-sys Platform';

/** Notice printed on the invoice when the recipient owes the VAT (reverse charge). */
export const REVERSE_CHARGE_TEXT = '„Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG.“';

/** Default daily rate of the platform fee (5,80 €), in cents. */
export const DEFAULT_PLATFORM_FEE_RATE = 580;

/** Lowest allowed unit price for any material, in cents. */
export const MIN_MATERIAL_UNIT_PRICE = 60;

export const CLIENT_NAMES: Record<ClientKind, string> = {
  telekom: 'Deutsche Telekom',
  vodafone: 'Vodafone',
  other: '',
};

export const CLIENT_LABELS: Record<ClientKind, string> = {
  telekom: 'Deutsche Telekom',
  vodafone: 'Vodafone',
  other: 'Anderer Auftraggeber',
};

/** Positions highlighted as tiles at the top of the PDF (shown only when used). */
export const SUMMARY_TILE_POSITIONS: { code: string; label: string }[] = [
  { code: '10075542', label: 'Gf-Kabel verlegt' },
  { code: '10075520', label: 'Kunststoff-Rohr' },
  { code: '10075530', label: 'Metall-Rohr/Kanal' },
  { code: '10075572', label: 'Zusätzl. Gf-Spleiße' },
  { code: '10060202', label: 'Gf-TA Connect Only' },
  { code: '10060220', label: 'Connect FTTH NE4' },
];
