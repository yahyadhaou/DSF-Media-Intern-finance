import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../ui/Button';
import { errorMessage, notify } from '../ui/dialogs';
import { Header } from '../ui/Layout';
import { colors, space } from '../ui/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PdfPreview } from './PdfPreview';
import { printHtml, sharePdf } from './sharePdf';

/** Full-screen PDF preview with the two things people do next: share as PDF, or print. */
export function PreviewScreen({
  title,
  subtitle,
  previewHtml,
  printHtmlSource,
  onBack,
}: {
  title: string;
  subtitle?: string;
  previewHtml: string;
  printHtmlSource: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      notify('Das hat nicht geklappt', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={title} subtitle={subtitle} onBack={onBack} />
      <PdfPreview html={previewHtml} />
      <View
        style={{
          flexDirection: 'row',
          gap: space.sm,
          padding: space.md,
          paddingBottom: Math.max(insets.bottom, space.md),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Button label="Drucken" icon="print-outline" variant="secondary" disabled={busy} onPress={() => void run(() => printHtml(printHtmlSource))} style={{ flex: 1 }} />
        <Button label="PDF teilen" icon="share-outline" loading={busy} onPress={() => void run(() => sharePdf(printHtmlSource, title))} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
}
