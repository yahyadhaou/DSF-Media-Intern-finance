import * as Print from 'expo-print';
import { PAGE_HEIGHT, PAGE_WIDTH } from './shell';

/**
 * Browser version (used when the app runs in a web browser, e.g. during development):
 * the browser's own print dialog can "Save as PDF".
 */
export async function sharePdf(html: string, _title: string): Promise<void> {
  await Print.printAsync({ html, width: PAGE_WIDTH, height: PAGE_HEIGHT });
}

export async function printHtml(html: string): Promise<void> {
  await Print.printAsync({ html, width: PAGE_WIDTH, height: PAGE_HEIGHT });
}
