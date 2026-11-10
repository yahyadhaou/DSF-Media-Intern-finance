import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { BackupFile } from './ports';

/** Writes the backup as a JSON file and opens the share sheet (save to Files / Drive, send by mail, ...). */
export async function exportBackupFile(backup: BackupFile): Promise<void> {
  const name = `DSF-Sicherung-${backup.exportedAt.slice(0, 10)}.json`;
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup, null, 2));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Teilen wird auf diesem Gerät nicht unterstützt.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Sicherung speichern' });
}

/** Lets the user pick a backup file (also one made by the web app). Returns `null` if cancelled. */
export async function pickBackupFile(): Promise<unknown | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled || result.assets.length === 0) return null;
  const text = await new File(result.assets[0].uri).text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Das ist keine gültige Sicherungsdatei.');
  }
}
