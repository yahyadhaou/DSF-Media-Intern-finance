import { ARIMO_WOFF2_BASE64 } from './arimoFont';

/** A4 in CSS px. 1 px = 1 pt here, so every number below is the same as in the web app's PDF. */
export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;

export type RenderMode = 'print' | 'preview';

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Escapes and keeps line breaks. */
export function escLines(text: string): string {
  return esc(text).replace(/\n/g, '<br>');
}

const BASE_CSS = `
@font-face{font-family:'Arimo';src:url(data:font/woff2;base64,${ARIMO_WOFF2_BASE64}) format('woff2');font-weight:400 700;font-style:normal;font-display:block}
@page{size:${PAGE_WIDTH}px ${PAGE_HEIGHT}px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${PAGE_WIDTH}px}
body{font-family:'Arimo','Helvetica','Arial',sans-serif;line-height:1.1;-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-text-size-adjust:100%}
.page{position:relative;width:${PAGE_WIDTH}px;height:${PAGE_HEIGHT}px;overflow:hidden;background:#fff;break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.abs{position:absolute}
.b{font-weight:700}
`;

const PREVIEW_CSS = `
html,body{background:#E6ECF2}
.page{margin:0 0 14px;box-shadow:0 1px 6px rgba(11,31,51,.18)}
.page:last-child{margin-bottom:0}
`;

/** Wraps finished A4 pages into one HTML document for printing or previewing. */
export function documentHtml(options: { title: string; css: string; pages: string[]; mode: RenderMode }): string {
  const { title, css, pages, mode } = options;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title>`
    + `<meta name="viewport" content="width=${PAGE_WIDTH}, initial-scale=1, user-scalable=no">`
    + `<style>${BASE_CSS}${mode === 'preview' ? PREVIEW_CSS : ''}${css}</style></head><body>`
    + pages.map((page) => `<section class="page">${page}</section>`).join('')
    + '</body></html>';
}

/** Splits a flow of fixed-height blocks into pages. */
export class PageFlow {
  readonly pages: string[][] = [[]];
  private used = 0;

  constructor(private readonly capacity: number) {}

  /** Remaining height on the current page. */
  get remaining(): number {
    return this.capacity - this.used;
  }

  get isEmptyPage(): boolean {
    return this.used === 0;
  }

  /** Starts a new page unless `height` still fits on this one. Returns true when a break happened. */
  ensure(height: number): boolean {
    if (this.used + height <= this.capacity || this.used === 0) return false;
    this.pages.push([]);
    this.used = 0;
    return true;
  }

  add(html: string, height: number): void {
    this.pages[this.pages.length - 1].push(html);
    this.used += height;
  }
}
