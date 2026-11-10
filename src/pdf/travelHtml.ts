import {
  applyRate,
  computeTravelTotals,
  formatDecimal,
  formatDuration,
  formatDurationShort,
  formatEur,
  formatKm,
  formatRate,
  formatTravelDate,
  roundTripKm,
  tripAmount,
  type TravelStatement,
  type TravelTrip,
} from '../domain/travel';
import type { CompanySettings } from '../domain/types';
import { documentHtml, esc, escLines, type RenderMode } from './shell';
import { countLines } from './textMetrics';

/**
 * HTML version of `TravelDocument` of the web app: the same absolute geometry
 * (1 px = 1 pt on a 595 × 842 page), so both produce the same A4 statement.
 */

const C = {
  teal: '#00A7A2',
  navy: '#0B3D5C',
  gray: '#5B6B78',
  tint: '#EAFAF9',
  totalTint: '#D6F4F2',
  border: '#B9E6E3',
  logoDark: '#0E8F8B',
  logoMid: '#17C9C4',
  logoAccent: '#D6247A',
};

const MARGIN = 42.5;
const CONTENT_WIDTH = 510.3;
const FIRST_TABLE_TOP = 219.1;
const NEXT_TABLE_TOP = 62;
const HEADER_HEIGHT = 26.4;
const PAGE_BOTTOM = 790;
const TOTALS_BLOCK_HEIGHT = 58;
const MIN_ROW_HEIGHT = 16.4;

const CSS = `
body{color:${C.navy}}
.topBar{position:absolute;top:0;left:0;right:0;height:8.5px;background:${C.teal}}
.eyebrow{font-weight:700;font-size:8.5px;color:${C.teal};letter-spacing:.9px;white-space:nowrap}
.title{font-weight:700;font-size:26px;color:${C.navy};white-space:nowrap}
.panel{position:absolute;left:${MARGIN}px;top:139.6px;width:${CONTENT_WIDTH}px;height:71px;background:${C.tint}}
.panelRule{position:absolute;left:0;right:0;top:0;height:1.2px;background:${C.teal}}
.kpiLabel{position:absolute;top:9.4px;font-weight:700;font-size:9px;color:${C.teal};letter-spacing:.4px;white-space:nowrap}
.kpiValue{position:absolute;top:22.2px;font-weight:700;font-size:17px;color:${C.navy};white-space:nowrap}
.kpiSuffix{font-weight:400;font-size:10px}
.table{position:absolute;left:${MARGIN}px;width:${CONTENT_WIDTH}px}
.head{display:flex;height:${HEADER_HEIGHT}px;background:${C.navy};align-items:center}
.head>div{font-weight:700;font-size:8.5px;color:#fff;padding:0 4px;line-height:1.2;hyphens:none}
.row{position:relative;display:flex;align-items:center;min-height:16.4px}
.row::after{content:'';position:absolute;left:0;right:0;bottom:0;height:.6px;background:${C.border}}
.cell{font-size:9.5px;padding:3.1px 4px .7px;line-height:1.263;hyphens:none;overflow-wrap:normal;word-break:normal;min-width:0}
.cell.grow,.head>div.grow{flex:1 1 0;padding-right:8px}
.compact .head>div{font-size:7.5px}
.compact .cell{font-size:8.5px;line-height:1.3}
.totalRow{display:flex;height:16.4px;background:${C.totalTint}}
.totalRow .cell{font-weight:700}
.note{margin-top:12.2px;padding-left:6px;font-size:9px;color:${C.gray};line-height:1.3}
.footerRule{position:absolute;left:${MARGIN}px;top:802.2px;width:${CONTENT_WIDTH}px;height:.6px;background:${C.teal}}
.footerText{position:absolute;top:810px;font-size:7.5px;color:${C.gray};white-space:nowrap}
`;

interface Column {
  key: 'nr' | 'date' | 'address' | 'client' | 'order' | 'duration' | 'single' | 'round' | 'amount';
  label: string;
  /** Fixed width in pt; `undefined` takes the remaining space. */
  width?: number;
}

function columns(statement: TravelStatement): { list: Column[]; compact: boolean } {
  const compact = statement.showClient || statement.showDuration;
  const list: Column[] = compact
    ? [
        { key: 'nr', label: 'NR.', width: 20 },
        { key: 'date', label: 'DATUM', width: 48 },
        { key: 'address', label: 'ZIELADRESSE' },
        ...(statement.showClient ? [{ key: 'client' as const, label: 'KUNDE', width: 70 }] : []),
        { key: 'order', label: 'AUFTRAGS-NR.', width: 66 },
        ...(statement.showDuration ? [{ key: 'duration' as const, label: 'DAUER', width: 38 }] : []),
        { key: 'single', label: 'EINFACH\n(KM)', width: 44 },
        { key: 'round', label: 'HIN & ZURÜCK\n(KM)', width: 56 },
        { key: 'amount', label: 'BETRAG\n(EUR)', width: 44 },
      ]
    : [
        { key: 'nr', label: 'NR.', width: 25.5 },
        { key: 'date', label: 'DATUM', width: 56.7 },
        { key: 'address', label: 'ZIELADRESSE' },
        { key: 'order', label: 'AUFTRAGS-NR.', width: 90.7 },
        { key: 'single', label: 'EINFACH\n(KM)', width: 48.2 },
        { key: 'round', label: 'HIN- & RÜCK\n(KM)', width: 62.3 },
        { key: 'amount', label: 'BETRAG\n(EUR)', width: 51.1 },
      ];
  return { list, compact };
}

function cellValue(column: Column, trip: TravelTrip, index: number, ratePerKm: number): string {
  switch (column.key) {
    case 'nr':
      return String(index + 1);
    case 'date':
      return formatTravelDate(trip.date);
    case 'address':
      return trip.address;
    case 'client':
      return trip.client;
    case 'order':
      return trip.orderNumber;
    case 'duration':
      return formatDurationShort(trip.durationMinutes);
    case 'single':
      return formatKm(trip.singleKm);
    case 'round':
      return formatKm(roundTripKm(trip));
    case 'amount':
      return formatDecimal(tripAmount(trip, ratePerKm));
  }
}

/**
 * Height of a row in pt, to decide where a page ends. The HTML is split into pages before it is
 * rendered, so the line count of every cell is predicted with real Helvetica glyph widths.
 */
function estimateRowHeight(trip: TravelTrip, index: number, ratePerKm: number, list: Column[], compact: boolean): number {
  const fixed = list.reduce((sum, column) => sum + (column.width ?? 0), 0);
  const fontSize = compact ? 8.5 : 9.5;
  const lineHeight = compact ? 8.5 * 1.3 : 9.5 * 1.263;
  const lines = list.reduce((most, column) => {
    // Cell padding is 4 pt left and right; the growing (address) column keeps 8 pt on the right.
    const inner = column.width ? column.width - 8 : CONTENT_WIDTH - fixed - 12;
    return Math.max(most, countLines(cellValue(column, trip, index, ratePerKm), fontSize, inner));
  }, 1);
  return Math.max(MIN_ROW_HEIGHT, lines * lineHeight + 3.1 + 0.7);
}

function paginate(heights: number[]): number[][] {
  const pages: number[][] = [];
  let current: number[] = [];
  let used = 0;
  let top = FIRST_TABLE_TOP + HEADER_HEIGHT;
  heights.forEach((height, index) => {
    if (top + used + height > PAGE_BOTTOM && current.length > 0) {
      pages.push(current);
      current = [];
      used = 0;
      top = NEXT_TABLE_TOP + HEADER_HEIGHT;
    }
    current.push(index);
    used += height;
  });
  pages.push(current);

  const last = pages[pages.length - 1];
  const lastTop = pages.length === 1 ? FIRST_TABLE_TOP + HEADER_HEIGHT : NEXT_TABLE_TOP + HEADER_HEIGHT;
  const lastUsed = last.reduce((sum, index) => sum + heights[index], 0);
  if (lastTop + lastUsed + TOTALS_BLOCK_HEIGHT > PAGE_BOTTOM && last.length > 1) {
    pages[pages.length - 1] = last.slice(0, -1);
    pages.push(last.slice(-1));
  }
  return pages;
}

const widthStyle = (column: Column) => (column.width ? `width:${column.width}px;flex:none` : '');
const cellClass = (column: Column) => (column.width ? 'cell' : 'cell grow');

const LOGO = `<div class="abs" style="left:${MARGIN}px;top:52px"><svg width="34" height="29" viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="14" width="6.5" height="10" rx="1.2" fill="${C.logoDark}"/>
<rect x="10" y="7" width="6.5" height="17" rx="1.2" fill="${C.logoMid}"/>
<rect x="20" y="0" width="6.5" height="24" rx="1.2" fill="${C.logoAccent}"/></svg>
<div style="font-weight:700;font-size:14px;color:${C.navy};margin-top:6px;white-space:nowrap">DSF <span style="color:${C.logoDark}">Media</span></div></div>`;

export function buildTravelHtml(statement: TravelStatement, company: CompanySettings, mode: RenderMode = 'print'): string {
  const totals = computeTravelTotals(statement);
  const { list, compact } = columns(statement);
  const heights = statement.trips.map((trip, index) => estimateRowHeight(trip, index, statement.ratePerKm, list, compact));
  const pages = paginate(heights);

  const kpis: { label: string; value: string; suffix?: string }[] = [
    { label: 'AUFTRÄGE', value: String(totals.trips), suffix: ` (${totals.confirmed} bestätigt)` },
    { label: 'GESAMTSTRECKE (HIN & ZURÜCK)', value: `${formatKm(totals.totalKm)} km` },
    { label: 'GESAMTBETRAG', value: formatEur(totals.amount) },
    ...(statement.showDuration ? [{ label: 'GESAMTFAHRZEIT', value: formatDuration(totals.durationMinutes) || '–' }] : []),
  ];
  const kpiLeft = kpis.length === 4 ? [14.2, 128, 292, 404] : [14.2, 161.6, 360];

  const head = () =>
    `<div class="head">${list
      .map((column) => `<div class="${column.width ? '' : 'grow'}" style="${widthStyle(column)}">${escLines(column.label)}</div>`)
      .join('')}</div>`;

  const html = pages.map((rowIndexes, pageIndex) => {
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === pages.length - 1;

    const intro = isFirst
      ? `${LOGO}`
        + `<div class="abs eyebrow" style="left:138.9px;top:45.2px">FAHRTKOSTENÜBERSICHT</div>`
        + `<div class="abs title" style="left:138.9px;top:63.6px">Aufträge &amp; Kilometerabrechnung</div>`
        + `<div class="abs" style="left:138.9px;top:97.8px;font-size:11px;white-space:nowrap"><span class="b">Startadresse:</span> ${esc(statement.startAddress)}</div>`
        + `<div class="abs" style="left:138.9px;top:112.8px;font-size:11px;color:${C.gray};white-space:nowrap"><span class="b">Berechnung:</span> Hin- und Rückfahrt je Auftrag · Satz ${formatRate(statement.ratePerKm)} EUR/km</div>`
        + `<div class="panel"><div class="panelRule"></div>${kpis
          .map(
            (kpi, index) =>
              `<div class="kpiLabel" style="left:${kpiLeft[index]}px">${esc(kpi.label)}</div>`
              + `<div class="kpiValue" style="left:${kpiLeft[index]}px">${esc(kpi.value)}${kpi.suffix ? `<span class="kpiSuffix">${esc(kpi.suffix)}</span>` : ''}</div>`,
          )
          .join('')}</div>`
      : '';

    const rows = rowIndexes
      .map((tripIndex) => {
        const trip = statement.trips[tripIndex];
        const background = tripIndex % 2 === 1 ? `background:${C.tint};` : '';
        const opacity = trip.confirmed ? '' : 'opacity:.55;';
        return `<div class="row" style="${background}${opacity}">${list
          .map((column) => `<div class="${cellClass(column)}" style="${widthStyle(column)}">${esc(cellValue(column, trip, tripIndex, statement.ratePerKm))}</div>`)
          .join('')}</div>`;
      })
      .join('');

    const totalRow = isLast
      ? `<div class="totalRow">${list
          .map((column) => {
            const text =
              column.key === 'address'
                ? 'Gesamt (bestätigte Fahrten)'
                : column.key === 'round'
                  ? formatKm(totals.totalKm)
                  : column.key === 'amount'
                    ? formatDecimal(totals.amount)
                    : column.key === 'duration'
                      ? formatDurationShort(totals.durationMinutes)
                      : '';
            return `<div class="${cellClass(column)}" style="${widthStyle(column)}">${esc(text)}</div>`;
          })
          .join('')}</div>`
        + `<div class="note"><span class="b">Quelle:</span> ${esc(applyRate(statement.sourceNote, statement.ratePerKm))}</div>`
      : '';

    return `<div class="topBar"></div>${intro}`
      + `<div class="table${compact ? ' compact' : ''}" style="top:${isFirst ? FIRST_TABLE_TOP : NEXT_TABLE_TOP}px">${head()}${rows}${totalRow}</div>`
      + `<div class="footerRule"></div>`
      + `<div class="footerText" style="left:${MARGIN}px">${esc(company.name)} · Fahrtkostenübersicht</div>`
      + `<div class="footerText" style="right:${MARGIN}px">Seite ${pageIndex + 1}</div>`;
  });

  return documentHtml({ title: 'Fahrtkostenübersicht', css: CSS, pages: html, mode });
}
