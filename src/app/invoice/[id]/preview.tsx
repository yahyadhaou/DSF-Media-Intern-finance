import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCompany, useInvoice } from '../../../data/hooks';
import { buildInvoiceHtml } from '../../../pdf/invoiceHtml';
import { PreviewScreen } from '../../../pdf/PreviewScreen';
import { goBack } from '../../../ui/Layout';
import { colors } from '../../../ui/theme';

export default function InvoicePreviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoice = useInvoice(id).data;
  const company = useCompany().data;

  const html = useMemo(
    () => (invoice && company ? { preview: buildInvoiceHtml(invoice, company, 'preview'), print: buildInvoiceHtml(invoice, company, 'print') } : null),
    [invoice, company],
  );

  if (!html || !invoice) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.tealDark} size="large" />
      </View>
    );
  }
  return (
    <PreviewScreen
      title={`Rechnung ${invoice.number ?? 'Entwurf'}`}
      subtitle="So sieht das PDF aus"
      previewHtml={html.preview}
      printHtmlSource={html.print}
      onBack={() => (router.canGoBack() ? goBack() : router.replace('/'))}
    />
  );
}
