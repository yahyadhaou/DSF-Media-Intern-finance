import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTravelActions, useTravelList } from '../../data/hooks';
import { computeTravelTotals, formatEur, formatKm, formatTravelDate, travelPeriod, type TravelStatement } from '../../domain/travel';
import { IconButton } from '../../ui/Button';
import { confirm, errorMessage, notify } from '../../ui/dialogs';
import { Fab } from '../../ui/Fab';
import { Badge, Card, EmptyState, Header } from '../../ui/Layout';
import { colors, font, space } from '../../ui/theme';

function TravelCard({ statement, onDelete }: { statement: TravelStatement; onDelete: () => void }) {
  const totals = computeTravelTotals(statement);
  const period = travelPeriod(statement);
  const draft = statement.status === 'draft';
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/travel/[id]', params: { id: statement.id } })}>
      <Card style={styles.card}>
        <View style={{ flex: 1, gap: 6 }}>
          <Badge label={draft ? 'Entwurf' : 'Abgeschlossen'} tone={draft ? 'warning' : 'success'} icon={draft ? 'create-outline' : 'checkmark-circle'} />
          <Text style={[font.h3, { fontSize: 17 }]}>
            {period ? (period.from === period.to ? formatTravelDate(period.from) : `${formatTravelDate(period.from)} – ${formatTravelDate(period.to)}`) : 'Ohne Datum'}
          </Text>
          <Text style={font.small}>
            {totals.confirmed} Fahrten · {formatKm(totals.totalKm)} km
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatEur(totals.amount)}</Text>
          {draft ? <IconButton icon="trash-outline" label="Entwurf löschen" color={colors.danger} onPress={onDelete} /> : null}
        </View>
      </Card>
    </Pressable>
  );
}

export default function TravelListScreen() {
  const { data, isLoading } = useTravelList();
  const { remove } = useTravelActions();
  // Tablets: two cards side by side.
  const columns = useWindowDimensions().width >= 720 ? 2 : 1;

  const askDelete = async (statement: TravelStatement) => {
    const ok = await confirm({ title: 'Entwurf löschen?', message: 'Die Abrechnung wird endgültig gelöscht.', confirmLabel: 'Löschen', destructive: true });
    if (!ok) return;
    try {
      await remove(statement.id);
    } catch (error) {
      notify('Löschen nicht möglich', errorMessage(error));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Fahrtkosten" subtitle="Kilometerabrechnung als PDF" />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.tealDark} />
      ) : (
        <FlatList
          key={columns}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          data={data}
          keyExtractor={(statement) => statement.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.cell, columns > 1 && styles.half]}>
              <TravelCard statement={item} onDelete={() => void askDelete(item)} />
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="car-outline" title="Noch keine Abrechnung" text="Erfasse deine Fahrten zu den Aufträgen und teile die Kilometerabrechnung als PDF." />}
        />
      )}
      <Fab label="Neue Abrechnung" onPress={() => router.push({ pathname: '/travel/[id]', params: { id: 'new' } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingTop: space.sm, gap: space.md, paddingBottom: 110 },
  row: { gap: space.md },
  cell: { flex: 1 },
  // Keeps a single card in the last row at half width.
  half: { maxWidth: '49%' },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 17, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
});
