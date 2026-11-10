import { todayIso } from '../../domain/dates';
import type { Invoice } from '../../domain/types';
import type { InvoiceRepository } from '../ports';
import { exclusive, readCounters, readInvoices, writeCounters, writeInvoices } from './storage';

const LOCKED_MESSAGE = 'Ausgestellte Rechnungen können nicht geändert werden.';

function formatNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

export const localInvoiceRepository: InvoiceRepository = {
  async list() {
    const invoices = await readInvoices();
    return invoices.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    return (await readInvoices()).find((invoice) => invoice.id === id);
  },

  save(invoice) {
    return exclusive(async () => {
      const all = await readInvoices();
      const existing = all.find((entry) => entry.id === invoice.id);
      if (existing?.status === 'issued') throw new Error(LOCKED_MESSAGE);

      // A reopened invoice keeps the number and date it was issued with.
      const saved: Invoice = {
        ...invoice,
        status: 'draft',
        number: existing?.number ?? null,
        issuedAt: existing?.issuedAt ?? null,
        updatedAt: new Date().toISOString(),
      };
      await writeInvoices([...all.filter((entry) => entry.id !== invoice.id), saved]);
      return saved;
    });
  },

  delete(id) {
    return exclusive(async () => {
      const all = await readInvoices();
      const entry = all.find((invoice) => invoice.id === id);
      if (entry?.status === 'issued') throw new Error(LOCKED_MESSAGE);
      // Deleting would leave a gap in the invoice numbers.
      if (entry?.number) throw new Error(`${entry.number} hat schon eine Rechnungsnummer und kann nicht gelöscht werden.`);
      await writeInvoices(all.filter((invoice) => invoice.id !== id));
    });
  },

  issue(id) {
    return exclusive(async () => {
      const all = await readInvoices();
      const invoice = all.find((entry) => entry.id === id);
      if (!invoice) throw new Error('Rechnung nicht gefunden.');
      if (invoice.status === 'issued') throw new Error(LOCKED_MESSAGE);

      // Reissuing a corrected invoice: same number, same date, no new counter value.
      if (invoice.number) {
        const reissued: Invoice = { ...invoice, status: 'issued', issuedAt: invoice.issuedAt ?? todayIso(), updatedAt: new Date().toISOString() };
        await writeInvoices(all.map((entry) => (entry.id === id ? reissued : entry)));
        return reissued;
      }

      const year = new Date().getFullYear();
      const counterKey = `invoice-${year}`;
      const counters = await readCounters();
      const sequence = (counters[counterKey] ?? 0) + 1;

      const issued: Invoice = {
        ...invoice,
        status: 'issued',
        number: formatNumber('RE', year, sequence),
        issuedAt: todayIso(),
        updatedAt: new Date().toISOString(),
      };
      // Counter first, invoice second: a crash in between can only skip a number, never reuse one.
      await writeCounters({ ...counters, [counterKey]: sequence });
      await writeInvoices(all.map((entry) => (entry.id === id ? issued : entry)));
      return issued;
    });
  },

  reopen(id) {
    return exclusive(async () => {
      const all = await readInvoices();
      const invoice = all.find((entry) => entry.id === id);
      if (!invoice) throw new Error('Rechnung nicht gefunden.');
      const reopened: Invoice = { ...invoice, status: 'draft', updatedAt: new Date().toISOString() };
      await writeInvoices(all.map((entry) => (entry.id === id ? reopened : entry)));
      return reopened;
    });
  },
};
