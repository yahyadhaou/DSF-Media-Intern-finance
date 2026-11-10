import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useInvoiceActions } from '../../data/hooks';
import { computeTotals } from '../../domain/calc';
import { PLATFORM_FEE_LABEL } from '../../domain/constants';
import { formatDate, formatPeriod } from '../../domain/dates';
import { duplicateAsDraft } from '../../domain/factory';
import { formatEuro } from '../../domain/money';
import type { Invoice } from '../../domain/types';
import { Button } from '../../ui/Button';
import { errorMessage, notify } from '../../ui/dialogs';
import { Badge, Card, goBack, Header, KeyValue, Notice, Screen, SectionTitle } from '../../ui/Layout';
import { font, space } from '../../ui/theme';

/** Read-only view of an issued invoice: it can be shared again, or copied into a new draft. */
export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const actions = useInvoiceActions();
  const totals = computeTotals(invoice);

  const duplicate = async () => {
    try {
      const copy = await actions.save(duplicateAsDraft(invoice));
      router.replace({ pathname: '/invoice/[id]', params: { id: copy.id } });
    } catch (error) {
      notify('Kopieren nicht möglich', errorMessage(error));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={invoice.number ?? 'Rechnung'} subtitle={invoice.issuedAt ? `Ausgestellt am ${formatDate(invoice.issuedAt)}` : undefined} onBack={() => goBack('/')} />
      <Screen
        footer={
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Kopie" icon="copy-outline" variant="secondary" onPress={() => void duplicate()} style={{ flex: 1 }} />
            <Button label="PDF ansehen & teilen" icon="document-text" onPress={() => router.push({ pathname: '/invoice/[id]/preview', params: { id: invoice.id } })} style={{ flex: 2 }} />
          </View>
        }
      >
        <Notice tone="teal">Diese Rechnung ist ausgestellt und kann nicht mehr geändert werden. Mit „Kopie“ startest du einen neuen Entwurf mit denselben Positionen.</Notice>

        <Card>
          <Badge label="Ausgestellt" tone="success" icon="checkmark-circle" />
          <Text style={font.h3}>{invoice.client.name}</Text>
          <Text style={font.small}>
            {[invoice.client.street, `${invoice.client.zip} ${invoice.client.city}`.trim()].filter(Boolean).join(', ')}
          </Text>
          <Text style={font.body}>
            {invoice.owner.name} · {formatPeriod(invoice.executionFrom, invoice.executionTo)}
          </Text>
          {invoice.orderNumber ? <Text style={font.small}>Auftrags-Nr. {invoice.orderNumber}</Text> : null}
        </Card>

        <SectionTitle>Beträge</SectionTitle>
        <Card>
          <KeyValue label="Positionen" value={`${invoice.serviceLines.length} Leistungen, ${invoice.materialLines.length} Material`} />
          {totals.platformFee > 0 ? <KeyValue label={`abzgl. ${PLATFORM_FEE_LABEL}`} value={formatEuro(-totals.platformFee)} /> : null}
          <KeyValue label="Nettobetrag" value={formatEuro(totals.net)} />
          {invoice.chargeVat ? <KeyValue label="USt." value={formatEuro(totals.vat)} /> : null}
          <KeyValue label="Gesamtbetrag" value={formatEuro(totals.gross)} strong />
        </Card>
      </Screen>
    </View>
  );
}
