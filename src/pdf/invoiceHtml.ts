import { computeTotals, lineNetAmounts, netUnitPrice, platformFeeAmount, sortByCode, summaryTiles } from '../domain/calc';
import { PLATFORM_FEE_LABEL, REVERSE_CHARGE_TEXT } from '../domain/constants';
import { formatDate, formatPeriod, todayIso } from '../domain/dates';
import { formatEuro, formatQuantity } from '../domain/money';
import type { Cents, CompanySettings, Invoice, InvoiceLine } from '../domain/types';
import { documentHtml, esc, escLines, PageFlow, type RenderMode } from './shell';
import { countLines } from './textMetrics';

/**
 * HTML version of `InvoiceDocument` of the web app: same colours, sizes and spacing
 * (1 px = 1 pt on a 595 × 842 page), so both produce the same A4 invoice.
 */

const C = {
  navy: '#0B1F33',
  teal: '#17C9C4',
  tealDark: '#0E8F8B',
  magenta: '#D6247A',
  ink: '#0B1220',
  muted: '#5B6878',
  line: '#E6ECF2',
  panel: '#F3F6F9',
  zebra: '#F8FAFC',
};

/** Usable height per page: 842 − 36 (top) − 96 (bottom, footer zone). */
const BODY_HEIGHT = 710;
/**
 * react-pdf lays text out with a default line height of 1.1 x font size and puts any extra
 * leading *below* a line, CSS puts half of it above. The numbers below are the react-pdf
 * layout of the web app's InvoiceDocument, so both documents break at the same place.
 */
const LINE = 1.1;
const ROW_HEIGHT = 19;
const HEAD_ROW_HEIGHT = 20;
const SECTION_TITLE_HEIGHT = 11.7;
const BLOCK_GAP = 15;
const TOTALS_ROW_HEIGHT = 13.5;
const GRAND_HEIGHT = 26.65;
const META_ROW_HEIGHT = 12.9;

const HEADER_HEIGHT = 57.65;
const ADDRESS_COLUMN_HEIGHT = 66.55;
const OWNER_HEIGHT = 61.6;
const TILES_HEIGHT = 47.55;

const CSS = `
body{font-size:9.5px;color:${C.ink}}
.body{position:absolute;left:36px;right:36px;top:36px}
.band{position:absolute;top:0;left:0;right:0;height:8px;display:flex}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-top:8px;height:49.65px}
.logoRow{display:flex;align-items:center}
.brand{font-weight:700;font-size:20px;color:${C.navy};margin-left:9px}
.brand span{color:${C.tealDark}}
.tagline{font-size:6.5px;letter-spacing:1.2px;color:${C.muted};margin-top:5px}
.title{font-weight:700;font-size:22px;color:${C.navy};text-align:right;letter-spacing:.6px}
.metaStrong{font-weight:700;font-size:10px;text-align:right;margin-top:4px}
.metaMuted{font-size:9.5px;color:${C.muted};text-align:right}
.addressRow{display:flex;justify-content:space-between;margin-top:20px}
.addressCol{flex:1;margin-right:21px}
.senderLine{font-size:6.5px;color:${C.muted};border-bottom:.6px solid #CBD5E1;padding-bottom:2px;margin-bottom:6px}
.eyebrow{font-weight:700;font-size:7px;letter-spacing:1px;color:${C.tealDark};margin-bottom:4px}
.eyebrow.muted{color:${C.muted}}
.strong{font-weight:700;font-size:10.5px}
.bodyText{font-size:9.5px;line-height:1.45;color:#334155;position:relative;top:-1.58px}
.metaBox{width:225px;background:${C.panel};border-radius:5px;padding:9px 12px}
.metaRow{display:flex;justify-content:space-between;padding:1.5px 0;font-size:9px;height:12.9px}
.metaLabel{color:${C.muted}}
.metaValue{font-weight:700}
.ownerRow{margin-top:15px;padding-top:9px;border-top:.6px solid ${C.line};height:46.6px}
.ownerKind{font-weight:400;color:${C.muted}}
.tiles{display:flex;margin-top:11.3px;height:36.25px}
.tile{flex:1;background:${C.panel};border-top:2px solid ${C.teal};padding:5px 7px 6px;margin-right:6px}
.tile:last-child{margin-right:0}
.tileLabel{font-weight:700;font-size:6.5px;color:${C.muted};letter-spacing:.4px}
.tileValue{font-weight:700;font-size:14px;color:${C.navy};margin-top:2px}
.tileUnit{font-weight:400;font-size:8.5px;color:${C.muted}}
.sectionTitle{margin-top:${BLOCK_GAP}px;font-weight:700;font-size:7px;letter-spacing:1px;color:${C.tealDark};margin-bottom:4px;height:7.7px}
.row{display:flex;align-items:center;padding:0 7px;border-bottom:.6px solid ${C.line}}
.row.head{height:${HEAD_ROW_HEIGHT}px;background:${C.navy};border-bottom:0}
.row.alt{background:${C.zebra}}
.row:not(.head)>div{padding-top:2.8px}
.row .head{font-weight:700;font-size:7px;color:#fff;letter-spacing:.5px}
.cPos{width:52px;flex:none}
.cDesc{flex:1;padding-right:6px;min-width:0}
.cQty{width:42px;flex:none;text-align:right}
.cUnit{width:34px;flex:none;padding-left:6px}
.cPrice{width:62px;flex:none;text-align:right}
.cTotal{width:68px;flex:none;text-align:right}
.totals{width:230px;margin-left:auto}
.totalsRow{display:flex;justify-content:space-between;height:${TOTALS_ROW_HEIGHT}px;padding:0 7px;position:relative}
.totalsRule{position:absolute;left:0;right:0;bottom:1.4px;height:.6px;background:#CBD5E1}
.grand{display:flex;justify-content:space-between;align-items:center;background:${C.navy};border-radius:4px;padding:7px 9px;margin-top:-2.2px}
.grandLabel{font-weight:700;font-size:8.5px;color:#fff;letter-spacing:.5px}
.grandValue{font-weight:700;font-size:13.5px;color:#fff}
.reverse{font-weight:700;font-size:9px;color:${C.ink};margin-top:34.7px}
.bank{width:250px;margin-top:14px;background:${C.panel};border-radius:5px;padding:9px 12px}
.bankRow{display:flex;padding:1.5px 0;font-size:9px;height:12.9px}
.bankLabel{width:78px;color:${C.muted}}
.footer{position:absolute;left:36px;right:36px;bottom:22px;border-top:.6px solid #CBD5E1;padding-top:7px;display:flex;font-size:7.5px;line-height:1.5;color:${C.muted}}
.footer>div{flex:1}
.footer>div>div{position:relative;top:-1.44px}
.footer .strong2{font-weight:700;color:${C.navy}}
.footer .pageNo{position:absolute;right:0;top:7px;flex:none}
`;

const LOGO = `<svg width="30" height="26" viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="14" width="6.5" height="10" rx="1.2" fill="${C.tealDark}"/>
<rect x="10" y="7" width="6.5" height="17" rx="1.2" fill="${C.teal}"/>
<rect x="20" y="0" width="6.5" height="24" rx="1.2" fill="${C.magenta}"/></svg>`;

const BAND = `<div class="band"><div style="flex:60;background:${C.navy}"></div><div style="flex:28;background:${C.teal}"></div><div style="flex:12;background:${C.magenta}"></div></div>`;

interface TableRow {
  position: string;
  description: string;
  quantity: string;
  unit: string;
  price: string;
  total: string;
}

/** Description column: 523 pt table − 14 pt row padding − 258 pt of fixed columns − 6 pt right padding. */
const DESCRIPTION_WIDTH = 245;
function rowHeight(description: string): number {
  const lines = countLines(description, 9.5, DESCRIPTION_WIDTH);
  return Math.max(ROW_HEIGHT, Math.ceil(lines * 9.5 * LINE + 6));
}

function renderRow(row: TableRow, alt: boolean, height: number): string {
  return `<div class="row${alt ? ' alt' : ''}" style="height:${height}px">`
    + `<div class="cPos">${esc(row.position) || '&nbsp;'}</div>`
    + `<div class="cDesc">${esc(row.description)}</div>`
    + `<div class="cQty">${row.quantity}</div>`
    + `<div class="cUnit">${esc(row.unit)}</div>`
    + `<div class="cPrice">${row.price}</div>`
    + `<div class="cTotal">${row.total}</div></div>`;
}

function tableHead(title: string, descriptionLabel: string): string {
  return `<div class="sectionTitle">${esc(title.toUpperCase())}</div>`
    + `<div class="row head"><div class="cPos head">POS.-NR.</div><div class="cDesc head">${esc(descriptionLabel.toUpperCase())}</div>`
    + `<div class="cQty head">MENGE</div><div class="cUnit head">EINH.</div><div class="cPrice head">EINZELPREIS</div><div class="cTotal head">GESAMT</div></div>`;
}

function totalsRow(label: string, value: string, options: { bold?: boolean; rule?: boolean } = {}): string {
  return `<div class="totalsRow"><span class="metaLabel">${esc(label)}</span><span${options.bold ? ' class="b"' : ''}>${value}</span>`
    + `${options.rule ? '<div class="totalsRule"></div>' : ''}</div>`;
}

function metaRow(label: string, value: string): string {
  return value ? `<div class="metaRow"><span class="metaLabel">${esc(label)}</span><span class="metaValue">${esc(value)}</span></div>` : '';
}

function footer(company: CompanySettings, pageNumber: number, totalPages: number): string {
  const lines = [
    company.printVatId && company.vatId ? `<div>USt-IdNr.: ${esc(company.vatId)}</div>` : '',
    company.printTaxNumber && company.taxNumber ? `<div>Steuernr.: ${esc(company.taxNumber)}</div>` : '',
    company.printCommercialRegister && company.commercialRegister ? `<div>Handelsregister: ${esc(company.commercialRegister)}</div>` : '',
  ].join('');
  return `<div class="footer">`
    + `<div><div class="strong2">${esc(company.name)}</div><div>${esc(company.street)}</div><div>${esc(`${company.zip} ${company.city}`)}</div></div>`
    + `<div><div>${esc(company.phone)}</div><div>${esc(company.email)}</div><div>${esc(company.website)}</div></div>`
    + `<div><div>Geschäftsführer: ${esc(company.managingDirector)}</div>${lines}</div>`
    + `<div class="pageNo">Seite ${pageNumber} / ${totalPages}</div></div>`;
}

export function buildInvoiceHtml(source: Invoice, company: CompanySettings, mode: RenderMode = 'print'): string {
  const invoice = { ...source, serviceLines: sortByCode(source.serviceLines) };
  const totals = computeTotals(invoice);
  const { client, owner } = invoice;
  const tiles = summaryTiles(invoice.serviceLines);
  const ownerAddress = [owner.street, `${owner.zip} ${owner.city}`.trim()].filter(Boolean).join(' · ');
  const netAmounts = lineNetAmounts(invoice);
  const sum = (amounts: Cents[]) => amounts.reduce((total, value) => total + value, 0);
  const invoiceDate = invoice.issuedAt ?? todayIso();
  const bankLines = [
    ['IBAN', company.iban],
    ['BIC', company.bic],
    ['Bankleitzahl', company.bankCode],
    ['Kontonummer', company.accountNumber],
  ].filter(([, value]) => value.trim());

  const flow = new PageFlow(BODY_HEIGHT);

  // --- Page head ---------------------------------------------------------------------------
  flow.add(
    `<div class="header"><div><div class="logoRow">${LOGO}<div class="brand">DSF <span>Media</span></div></div>`
      + `<div class="tagline">· GLASFASER-NETZBAU &amp; MONTAGE</div></div>`
      + `<div><div class="title">RECHNUNG</div><div class="metaStrong">${invoice.number ? `Nr. ${esc(invoice.number)}` : 'ENTWURF'}</div>`
      + `<div class="metaMuted">Rechnungsdatum ${formatDate(invoiceDate)}</div></div></div>`,
    HEADER_HEIGHT,
  );
  const metaRows = [invoice.orderNumber, invoice.purchaseOrderNumber, formatPeriod(invoice.executionFrom, invoice.executionTo)].filter(Boolean).length;
  const addressHeight = Math.max(ADDRESS_COLUMN_HEIGHT, 18 + META_ROW_HEIGHT * (1 + metaRows));
  flow.add(
    `<div class="addressRow" style="height:${addressHeight}px"><div class="addressCol">`
      + `<div class="senderLine">${esc(`${company.name} · ${company.street} · ${company.zip} ${company.city}`)}</div>`
      + `<div class="eyebrow muted">RECHNUNG AN</div><div class="strong">${esc(client.name) || '–'}</div>`
      + `<div class="bodyText">${escLines(`${client.street}\n${client.zip} ${client.city}`)}</div></div>`
      + `<div class="metaBox"><div class="metaRow">&nbsp;</div>`
      + `${metaRow('Auftrags-Nr.', invoice.orderNumber)}${metaRow('Bestell-Nr.', invoice.purchaseOrderNumber)}`
      + `${metaRow('Leistungszeitraum', formatPeriod(invoice.executionFrom, invoice.executionTo))}</div></div>`,
    20 + addressHeight,
  );
  flow.add(
    `<div class="ownerRow"><div class="eyebrow">OBJEKT / HAUSEIGENTÜMER</div>`
      + `<div class="strong">${esc(owner.name) || '–'} <span class="ownerKind">(${owner.kind === 'private' ? 'Privatperson' : 'Firma'})</span></div>`
      + `<div class="bodyText">${esc(ownerAddress) || '&nbsp;'}</div></div>`,
    OWNER_HEIGHT,
  );
  if (tiles.length > 0) {
    flow.add(
      `<div class="tiles">${tiles
        .map(
          (tile) =>
            `<div class="tile"><div class="tileLabel">${esc(tile.label.toUpperCase())}</div>`
            + `<div class="tileValue">${formatQuantity(tile.quantity)} <span class="tileUnit">${esc(tile.unit)}</span></div></div>`,
        )
        .join('')}</div>`,
      TILES_HEIGHT,
    );
  }

  // --- Tables ------------------------------------------------------------------------------
  const addTable = (title: string, descriptionLabel: string, lines: InvoiceLine[], amounts: Cents[], extra?: TableRow) => {
    const rows: TableRow[] = lines.map((line, index) => ({
      position: line.code ?? String(index + 1),
      description: line.description,
      quantity: formatQuantity(line.quantity),
      unit: line.unit,
      price: formatEuro(Math.round(netUnitPrice(line, invoice.vatRate, invoice.pricesIncludeVat))),
      total: formatEuro(amounts[index]),
    }));
    if (extra) rows.push(extra);
    if (rows.length === 0) return;

    const headHeight = BLOCK_GAP + SECTION_TITLE_HEIGHT + HEAD_ROW_HEIGHT;
    flow.ensure(headHeight + rowHeight(rows[0].description));
    flow.add(tableHead(title, descriptionLabel), headHeight);
    rows.forEach((row, index) => {
      const height = rowHeight(row.description);
      flow.ensure(height);
      flow.add(renderRow(row, index % 2 === 1, height), height);
    });
  };

  const { days, dailyRate } = invoice.platformFee;
  addTable(
    'Erbrachte Leistungen',
    'Beschreibung',
    invoice.serviceLines,
    netAmounts.service,
    days > 0
      ? {
          position: '',
          description: PLATFORM_FEE_LABEL,
          quantity: formatQuantity(days),
          unit: days === 1 ? 'Tag' : 'Tage',
          price: formatEuro(dailyRate),
          total: formatEuro(platformFeeAmount(invoice.platformFee)),
        }
      : undefined,
  );
  addTable('Verbrauchtes Material (Einzelnachweis)', 'Artikel', invoice.materialLines, netAmounts.material);

  // --- Totals ------------------------------------------------------------------------------
  const totalsRows =
    totalsRow('Summe Leistungen', formatEuro(sum(netAmounts.service)))
    + totalsRow('Summe Material', formatEuro(sum(netAmounts.material)), { rule: totals.platformFee === 0 })
    + (totals.platformFee > 0 ? totalsRow(`abzgl. ${PLATFORM_FEE_LABEL}`, formatEuro(-totals.platformFee), { rule: true }) : '')
    + totalsRow('Nettobetrag', formatEuro(totals.net), { bold: true })
    + (invoice.chargeVat
      ? totalsRow(`zzgl. ${Math.round(invoice.vatRate * 100)} % USt.`, formatEuro(totals.vat))
      : '<div class="totalsRow"></div>');
  const rowCount = totals.platformFee > 0 ? 5 : 4;
  const totalsHeight = (rowCount + 1) * TOTALS_ROW_HEIGHT + GRAND_HEIGHT - TOTALS_ROW_HEIGHT;
  const brokeBeforeTotals = flow.ensure(totalsHeight);
  flow.add(
    `<div class="totals" style="${brokeBeforeTotals ? '' : 'margin-top:-.6px'}">${totalsRows}`
      + `<div class="grand"><span class="grandLabel">GESAMTBETRAG</span><span class="grandValue">${formatEuro(totals.gross)}</span></div></div>`,
    totalsHeight,
  );

  if (invoice.reverseChargeNote) {
    const height = 34.7 + 9 * LINE;
    flow.ensure(height);
    flow.add(`<div class="reverse">${esc(REVERSE_CHARGE_TEXT)}</div>`, height);
  }

  if (invoice.showBankDetails && bankLines.length > 0) {
    const height = 14 + 18 + 4 + 7 * LINE + bankLines.length * META_ROW_HEIGHT;
    flow.ensure(height);
    flow.add(
      `<div class="bank"><div class="eyebrow">BANKVERBINDUNG</div>${bankLines
        .map(([label, value]) => `<div class="bankRow"><span class="bankLabel">${esc(label)}</span><span class="metaValue">${esc(value)}</span></div>`)
        .join('')}</div>`,
      height,
    );
  }

  const pages = flow.pages.map((blocks, index) => `${BAND}<div class="body">${blocks.join('')}</div>${footer(company, index + 1, flow.pages.length)}`);
  return documentHtml({ title: `Rechnung ${invoice.number ?? 'Entwurf'}`, css: CSS, pages, mode });
}
