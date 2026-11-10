/** Browser version (development): `Alert.alert` does nothing on web, so use the browser dialogs. */
export function confirm(options: { title: string; message?: string; confirmLabel: string; destructive?: boolean }): Promise<boolean> {
  return Promise.resolve(window.confirm([options.title, options.message].filter(Boolean).join('\n\n')));
}

export function notify(title: string, message?: string): void {
  window.alert([title, message].filter(Boolean).join('\n\n'));
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unbekannter Fehler';
}
