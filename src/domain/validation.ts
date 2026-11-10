import { MIN_MATERIAL_UNIT_PRICE } from './constants';
import type { Invoice } from './types';

/** Returns a list of human-readable problems that block issuing the invoice. */
export function validateForIssue(invoice: Invoice): string[] {
  const problems: string[] = [];

  if (!invoice.client.name.trim()) problems.push('Auftraggeber: Name fehlt');
  if (!invoice.client.street.trim() || !invoice.client.zip.trim() || !invoice.client.city.trim()) {
    problems.push('Auftraggeber: Rechnungsadresse unvollständig');
  }
  if (!invoice.owner.name.trim()) problems.push('Hauseigentümer: Name fehlt');
  if (invoice.serviceLines.length + invoice.materialLines.length === 0) {
    problems.push('Keine Leistungen oder Materialien auf der Rechnung');
  }
  if (invoice.materialLines.some((line) => !line.description.trim())) {
    problems.push('Material: Bezeichnung fehlt');
  }
  if (invoice.materialLines.some((line) => line.unitPrice < MIN_MATERIAL_UNIT_PRICE)) {
    problems.push('Material: Einzelpreis unter dem Minimum');
  }

  return problems;
}
