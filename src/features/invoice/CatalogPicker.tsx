import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { shortCode } from '../../domain/calc';
import { formatEuro } from '../../domain/money';
import type { CatalogItem, CatalogKind } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { EmptyState } from '../../ui/Layout';
import { Sheet } from '../../ui/Sheet';
import { colors, font, radius, space, TOUCH } from '../../ui/theme';

/**
 * Search the price list and tap to add. The sheet stays open so several positions
 * can be added in a row; a counter shows how many of each are already on the invoice.
 */
export function CatalogPicker({
  visible,
  kind,
  items,
  counts,
  onPick,
  onClose,
}: {
  visible: boolean;
  kind: CatalogKind;
  items: CatalogItem[];
  /** Quantity already on the invoice, by catalog item id. */
  counts: Record<string, number>;
  onPick: (item: CatalogItem) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.kind === kind &&
        item.active &&
        (!needle || item.name.toLowerCase().includes(needle) || (item.code ?? '').includes(needle) || shortCode(item.code ?? '').includes(needle)),
    );
  }, [items, kind, query]);

  return (
    <Sheet
      visible={visible}
      tall
      title={kind === 'service' ? 'Position hinzufügen' : 'Material hinzufügen'}
      onClose={onClose}
      footer={<Button label="Fertig" icon="checkmark" onPress={onClose} block />}
    >
      <View style={styles.search}>
        <Icon name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={kind === 'service' ? 'Nummer oder Name suchen' : 'Material suchen'}
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.searchInput}
          accessibilityLabel="Suche"
        />
      </View>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.md }}
        ListEmptyComponent={<EmptyState icon="search-outline" title="Nichts gefunden" text="Prüfe die Schreibweise oder lege den Eintrag unter „Preise“ an." />}
        renderItem={({ item }) => {
          const count = counts[item.id] ?? 0;
          return (
            <Pressable accessibilityRole="button" onPress={() => onPick(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[font.body, { fontWeight: '600' }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={font.small}>
                  {item.code ? `${shortCode(item.code)} · ` : ''}
                  {formatEuro(item.unitPrice)} / {item.unit}
                </Text>
              </View>
              {count > 0 ? (
                <View style={styles.count}>
                  <Text style={styles.countText}>{count}×</Text>
                </View>
              ) : null}
              <Icon name="add-circle" size={30} color={colors.tealDark} />
            </Pressable>
          );
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: space.md,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface },
  count: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
