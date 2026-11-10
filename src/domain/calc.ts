import { SUMMARY_TILE_POSITIONS } from './constants';
import { newId } from './id';
import type { CatalogItem, Cents, Invoice, InvoiceLine, InvoiceTotals, PlatformFee, SummaryTile } from './types';

export function lineTotal(line: InvoiceLine): Cents {
  return Math.round(line.quantity * line.unitPrice);
}

export function sumLines(lines: InvoiceLine[]): Cents {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

/** Total of the platform fee (days × daily rate), net cents. */
export function platformFeeAmount(fee: PlatformFee): Cents {
  return Math.round(Math.max(0, fee.days) * fee.dailyRate);
}

/**
 * Gross mode (`pricesIncludeVat`): the sum of the lines is the amount to pay and the
 * VAT is split out of it. Net mode: VAT is added on top.
 * The platform fee is always a net amount: it is deducted from the net total and the
 * VAT is calculated on what remains.
 */
export function computeTotals(
  invoice: Pick<Invoice, 'serviceLines' | 'materialLines' | 'vatRate' | 'pricesIncludeVat' | 'chargeVat' | 'platformFee'>,
): InvoiceTotals {
  const servicesAmount = sumLines(invoice.serviceLines);
  const materialsAmount = sumLines(invoice.materialLines);
  const sum = servicesAmount + materialsAmount;
  const platformFee = platformFeeAmount(invoice.platformFee);
  const result = (net: Cents, vat: Cents): InvoiceTotals => ({
    servicesAmount,
    materialsAmount,
    platformFee,
    net,
    vat,
    gross: net + vat,
  });

  if (invoice.pricesIncludeVat) {
    const netBeforeFee = Math.round(sum / (1 + invoice.vatRate));
    const net = netBeforeFee - platformFee;
    if (!invoice.chargeVat) return result(net, 0);
    // Without a fee the partner's gross sum stays exactly the amount to pay.
    if (platformFee === 0) return { ...result(netBeforeFee, sum - netBeforeFee), gross: sum };
    return result(net, Math.round(net * invoice.vatRate));
  }

  const net = sum - platformFee;
  return result(net, invoice.chargeVat ? Math.round(net * invoice.vatRate) : 0);
}

/**
 * Net amount of every line, for the PDF. In gross mode the net total is
 * distributed over the lines (largest remainder), so the printed line amounts
 * add up to the printed net total to the cent.
 */
export function lineNetAmounts(
  invoice: Pick<Invoice, 'serviceLines' | 'materialLines' | 'vatRate' | 'pricesIncludeVat'>,
): { service: Cents[]; material: Cents[] } {
  const lines = [...invoice.serviceLines, ...invoice.materialLines];
  const split = (amounts: Cents[]) => ({
    service: amounts.slice(0, invoice.serviceLines.length),
    material: amounts.slice(invoice.serviceLines.length),
  });

  if (!invoice.pricesIncludeVat) return split(lines.map(lineTotal));

  const factor = 1 + invoice.vatRate;
  const exact = lines.map((line) => lineTotal(line) / factor);
  const amounts = exact.map(Math.floor);
  const targetNet = Math.round(sumLines(lines) / factor);
  let remainder = targetNet - amounts.reduce((sum, value) => sum + value, 0);

  const byFraction = exact.map((value, index) => ({ index, fraction: value - amounts[index] })).sort((a, b) => b.fraction - a.fraction);
  for (const { index } of byFraction) {
    if (remainder <= 0) break;
    amounts[index] += 1;
    remainder -= 1;
  }
  return split(amounts);
}

/** Unit price as printed on the PDF: net, in cents (fractional in gross mode). */
export function netUnitPrice(line: InvoiceLine, vatRate: number, pricesIncludeVat: boolean): number {
  return pricesIncludeVat ? line.unitPrice / (1 + vatRate) : line.unitPrice;
}

/** Orders lines by partner position number; lines without one go last. */
export function sortByCode(lines: InvoiceLine[]): InvoiceLine[] {
  const key = (line: InvoiceLine) => line.code ?? '￿';
  return [...lines].sort((a, b) => key(a).localeCompare(key(b)));
}

/** `10060202` → `60202`, the short form used on site. */
export function shortCode(code: string): string {
  return code.length > 5 && code.startsWith('100') ? code.slice(3) : code;
}

function lineFromCatalog(item: CatalogItem, quantity: number): InvoiceLine {
  return {
    id: newId(),
    catalogItemId: item.id,
    code: item.code ?? null,
    description: item.name,
    quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
  };
}

/** Adds one unit of the item; if it is already on the invoice its quantity goes up by one. */
export function addCatalogLine(item: CatalogItem, existing: InvoiceLine[]): InvoiceLine[] {
  const present = existing.some((line) => line.catalogItemId === item.id);
  if (!present) return [...existing, lineFromCatalog(item, 1)];
  return existing.map((line) => (line.catalogItemId === item.id ? { ...line, quantity: line.quantity + 1 } : line));
}

export function addFreeTextLine(existing: InvoiceLine[], unitPrice: Cents): InvoiceLine[] {
  return [
    ...existing,
    { id: newId(), catalogItemId: null, code: null, description: '', quantity: 1, unit: 'Stk', unitPrice },
  ];
}

/** Adds material lines for linked services that are on the invoice and not yet listed. */
export function suggestMaterialLines(
  serviceLines: InvoiceLine[],
  catalog: CatalogItem[],
  existing: InvoiceLine[],
): InvoiceLine[] {
  const additions = catalog.flatMap((item) => {
    if (item.kind !== 'material' || !item.active || !item.linkedItemId) return [];
    if (existing.some((line) => line.catalogItemId === item.id)) return [];
    const quantity = serviceLines
      .filter((line) => line.catalogItemId === item.linkedItemId)
      .reduce((sum, line) => sum + line.quantity, 0);
    return quantity > 0 ? [lineFromCatalog(item, quantity)] : [];
  });
  return [...existing, ...additions];
}

export function summaryTiles(serviceLines: InvoiceLine[]): SummaryTile[] {
  return SUMMARY_TILE_POSITIONS.flatMap(({ code, label }) => {
    const lines = serviceLines.filter((line) => line.code === code);
    const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
    return quantity > 0 ? [{ label, quantity, unit: lines[0].unit }] : [];
  });
}
