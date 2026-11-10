import { Alert } from 'react-native';

/** Yes/no question. Resolves `true` when the user confirms. */
export function confirm(options: { title: string; message?: string; confirmLabel: string; destructive?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      options.title,
      options.message,
      [
        { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
        { text: options.confirmLabel, style: options.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function notify(title: string, message?: string): void {
  Alert.alert(title, message);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unbekannter Fehler';
}
