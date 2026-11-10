import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useInvoiceActions, useInvoices } from '../../data/hooks';
import { computeTotals } from '../../domain/calc';
import { formatPeriod } from '../../domain/dates';
import { formatEuro } from '../../domain/money';
import type { Invoice } from '../../domain/types';
import { IconButton } from '../../ui/Button';
import { confirm, errorMessage, notify } from '../../ui/dialogs';
import { Fab } from '../../ui/Fab';
import { Badge, Card, Chip, EmptyState, Header } from '../../ui/Layout';
import { colors, font, space } from '../../ui/theme';

type Filter = 'all' | 'draft' | 'issued';

function InvoiceCard({ invoice, onDelete }: { invoice: Invoice; onDelete: () => void }) {
  const totals = computeTotals(invoice);
  const draft = invoice.status === 'draft';
  /** Reopened for a correction: has a number, may not be deleted. */
  const correcting = draft && !!invoice.number;
  const who = [invoice.client.name, invoice.owner.name].filter(Boolean).join(' · ');
  const period = formatPeriod(invoice.executionFrom, invoice.executionTo);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: invoice.id } })}>
      <Card style={styles.card}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.cardTop}>
            <Text style={styles.number}>{invoice.number ?? 'Entwurf'}</Text>
            <Badge label={correcting ? 'In Korrektur' : draft ? 'Entwurf' : 'Ausgestellt'} tone={draft ? 'warning' : 'success'} icon={draft ? 'create-outline' : 'checkmark-circle'} />
          </View>
          <Text style={font.body} numberOfLines={1}>
            {who || 'Noch kein Auftraggeber'}
          </Text>
          <Text style={font.small} numberOfLines={1}>
            {[period, invoice.owner.city].filter(Boolean).join(' · ') || 'Kein Zeitraum'}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatEuro(totals.gross)}</Text>
          {draft && !correcting ? <IconButton icon="trash-outline" label="Entwurf löschen" color={colors.danger} onPress={onDelete} /> : null}
        </View>
      </Card>
    </Pressable>
  );
}

export default function InvoicesScreen() {
  const { data, isLoading } = useInvoices();
  const { remove } = useInvoiceActions();
  const [filter, setFilter] = useState<Filter>('all');
  // Tablets: two cards side by side.
  const columns = useWindowDimensions().width >= 720 ? 2 : 1;

  const visible = useMemo(() => (data ?? []).filter((invoice) => filter === 'all' || invoice.status === filter), [data, filter]);

  const askDelete = async (invoice: Invoice) => {
    const ok = await confirm({ title: 'Entwurf löschen?', message: 'Der Entwurf wird endgültig gelöscht.', confirmLabel: 'Löschen', destructive: true });
    if (!ok) return;
    try {
      await remove(invoice.id);
    } catch (error) {
      notify('Löschen nicht möglich', errorMessage(error));
    }
  };

  return (
    <View style={styles.fill}>
      <Header title="Rechnungen" subtitle={data ? `${data.length} insgesamt` : undefined} />
      <View style={styles.filters}>
        <Chip label="Alle" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Entwürfe" active={filter === 'draft'} onPress={() => setFilter('draft')} />
        <Chip label="Ausgestellt" active={filter === 'issued'} onPress={() => setFilter('issued')} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.tealDark} />
      ) : (
        <FlatList
          key={columns}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          data={visible}
          keyExtractor={(invoice) => invoice.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.cell, columns > 1 && styles.half]}>
              <InvoiceCard invoice={item} onDelete={() => void askDelete(item)} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title={filter === 'all' ? 'Noch keine Rechnung' : 'Nichts in dieser Ansicht'}
              text={filter === 'all' ? 'Tippe auf „Neue Rechnung“. Alles wird automatisch gespeichert.' : 'Wechsle den Filter oben, um andere Rechnungen zu sehen.'}
            />
          }
        />
      )}
      <Fab label="Neue Rechnung" onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: 'new' } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  filters: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm },
  list: { padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 110 },
  row: { gap: space.md },
  cell: { flex: 1 },
  // Keeps a single card in the last row at half width.
  half: { maxWidth: '49%' },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  number: { ...font.h3, fontSize: 17 },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 17, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
});
