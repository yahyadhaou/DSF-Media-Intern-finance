import type { BackupFile } from './ports';

/** Browser version (development): download the JSON and pick one through a file input. */
export async function exportBackupFile(backup: BackupFile): Promise<void> {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DSF-Sicherung-${backup.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function pickBackupFile(): Promise<unknown | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve(JSON.parse(await file.text()));
      } catch {
        reject(new Error('Das ist keine gültige Sicherungsdatei.'));
      }
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
