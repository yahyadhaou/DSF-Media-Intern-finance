import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PAGE_HEIGHT, PAGE_WIDTH } from './shell';

/** `Rechnung RE-2026-0001` → `Rechnung_RE-2026-0001.pdf` */
function fileNameFor(title: string): string {
  const base = title.trim().replace(/[^\p{L}\p{N}-]+/gu, '_').replace(/^_+|_+$/g, '') || 'Dokument';
  return `${base}.pdf`;
}

/** Renders the HTML to a real PDF file with a readable name (A4, no extra margins). */
export async function createPdfFile(html: string, title: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html, width: PAGE_WIDTH, height: PAGE_HEIGHT });
  const target = new File(Paths.cache, fileNameFor(title));
  if (target.exists) target.delete();
  new File(uri).move(target);
  return target.uri;
}

/** Creates the PDF and opens the system share sheet (mail, WhatsApp, save to files, print, ...). */
export async function sharePdf(html: string, title: string): Promise<void> {
  const uri = await createPdfFile(html, title);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen wird auf diesem Gerät nicht unterstützt.');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}

/** Opens the system print dialog (AirPrint / Android print service). */
export async function printHtml(html: string): Promise<void> {
  await Print.printAsync({ html, width: PAGE_WIDTH, height: PAGE_HEIGHT });
}
