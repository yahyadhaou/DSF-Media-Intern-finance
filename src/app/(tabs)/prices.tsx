import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCatalog, useCatalogActions } from '../../data/hooks';
import { shortCode } from '../../domain/calc';
import { MIN_MATERIAL_UNIT_PRICE } from '../../domain/constants';
import { createCatalogItem } from '../../domain/factory';
import { formatEuro } from '../../domain/money';
import type { CatalogItem, CatalogKind, Unit } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Segmented, SwitchRow } from '../../ui/Controls';
import { confirm, errorMessage, notify } from '../../ui/dialogs';
import { Fab } from '../../ui/Fab';
import { MoneyField, TextField } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Badge, EmptyState, Header } from '../../ui/Layout';
import { Sheet } from '../../ui/Sheet';
import { colors, font, radius, space, TOUCH } from '../../ui/theme';

const UNITS: { value: Unit; label: string }[] = [
  { value: 'Stk', label: 'Stück' },
  { value: 'm', label: 'Meter' },
  { value: '15 Min', label: '15 Min' },
];

/** Price list: every position the invoices can use. Tap an entry to change its price. */
export default function PricesScreen() {
  const { data, isLoading } = useCatalog();
  const { save, remove } = useCatalogActions();
  const [kind, setKind] = useState<CatalogKind>('service');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CatalogItem | null>(null);

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data ?? []).filter((item) => item.kind === kind && (!needle || item.name.toLowerCase().includes(needle) || (item.code ?? '').includes(needle)));
  }, [data, kind, query]);

  const commit = async () => {
    if (!editing) return;
    try {
      await save(editing);
      setEditing(null);
    } catch (error) {
      notify('Speichern nicht möglich', errorMessage(error));
    }
  };

  const askDelete = async () => {
    if (!editing) return;
    const ok = await confirm({ title: 'Eintrag löschen?', message: 'Bestehende Rechnungen bleiben unverändert.', confirmLabel: 'Löschen', destructive: true });
    if (!ok) return;
    await remove(editing.id);
    setEditing(null);
  };

  const isMaterial = editing?.kind === 'material';
  const belowMinimum = !!editing && isMaterial && editing.unitPrice < MIN_MATERIAL_UNIT_PRICE;

  return (
    <View style={{ flex: 1 }}>
      <Header title="Preise" subtitle="Preisliste für Rechnungen" />
      <View style={styles.controls}>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'service', label: 'Leistungen' },
            { value: 'material', label: 'Material' },
          ]}
        />
        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.textMuted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Suchen" placeholderTextColor={colors.placeholder} autoCapitalize="none" autoCorrect={false} style={styles.searchInput} accessibilityLabel="Suche" />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.tealDark} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState icon="pricetags-outline" title="Nichts gefunden" text="Ändere die Suche oder lege mit „Neu“ einen Eintrag an." />}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => setEditing(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }, !item.active && { opacity: 0.55 }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[font.body, { fontWeight: '600' }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.meta}>
                  {item.code ? <Text style={font.small}>{shortCode(item.code)}</Text> : null}
                  {item.frequent ? <Badge label="Schnellauswahl" tone="teal" /> : null}
                  {!item.active ? <Badge label="Inaktiv" /> : null}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{formatEuro(item.unitPrice)}</Text>
                <Text style={font.small}>pro {item.unit}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Fab label="Neu" onPress={() => setEditing(createCatalogItem(kind, data ?? []))} />

      {editing ? (
        <Sheet
          visible
          title={editing.name ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          onClose={() => setEditing(null)}
          footer={
            <View style={{ gap: space.sm }}>
              <Button label="Speichern" icon="checkmark" disabled={!editing.name.trim() || belowMinimum} onPress={() => void commit()} block />
              {data?.some((item) => item.id === editing.id) ? <Button label="Löschen" icon="trash-outline" variant="danger" onPress={() => void askDelete()} block /> : null}
            </View>
          }
        >
          <View style={{ gap: space.md, paddingBottom: space.md }}>
            <TextField label="Bezeichnung" value={editing.name} onChangeText={(name) => setEditing({ ...editing, name })} />
            {!isMaterial ? <TextField label="Positions-Nr." keyboardType="number-pad" value={editing.code ?? ''} onChangeText={(code) => setEditing({ ...editing, code })} /> : null}
            <Segmented label="Einheit" options={UNITS} value={editing.unit} onChange={(unit) => setEditing({ ...editing, unit })} />
            <MoneyField
              label={isMaterial ? 'Einzelpreis' : 'Einzelpreis (Brutto laut Partner)'}
              value={editing.unitPrice}
              error={belowMinimum ? `Mindestens ${formatEuro(MIN_MATERIAL_UNIT_PRICE)}` : undefined}
              onChange={(unitPrice) => setEditing({ ...editing, unitPrice })}
            />
            {!isMaterial ? <SwitchRow title="In der Schnellauswahl" description="Erscheint als Button beim Erstellen einer Rechnung." value={!!editing.frequent} onChange={(frequent) => setEditing({ ...editing, frequent })} /> : null}
            <SwitchRow title="Aktiv" description="Inaktive Einträge sind beim Auswählen versteckt." value={editing.active} onChange={(active) => setEditing({ ...editing, active })} />
          </View>
        </Sheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: TOUCH,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  list: { padding: space.lg, paddingTop: space.sm, gap: space.sm, paddingBottom: 110 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  price: { fontSize: 16, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
});
