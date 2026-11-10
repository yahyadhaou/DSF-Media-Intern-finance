import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { lineTotal, shortCode } from '../../domain/calc';
import { MIN_MATERIAL_UNIT_PRICE } from '../../domain/constants';
import { formatEuro } from '../../domain/money';
import type { InvoiceLine, Unit } from '../../domain/types';
import { IconButton } from '../../ui/Button';
import { Segmented } from '../../ui/Controls';
import { MoneyField, NumberField, TextField } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Card } from '../../ui/Layout';
import { colors, font, radius, space } from '../../ui/theme';

interface LineCardProps {
  line: InvoiceLine;
  onChange: (line: InvoiceLine) => void;
  onRemove: () => void;
}

/** One service position: code, name, quantity, price (tap to change) and total. */
export function ServiceLineCard({ line, onChange, onRemove }: LineCardProps) {
  const [editPrice, setEditPrice] = useState(false);
  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.top}>
        {line.code ? (
          <View style={styles.code}>
            <Text style={styles.codeText}>{shortCode(line.code)}</Text>
          </View>
        ) : null}
        <Text style={[font.body, { flex: 1, fontWeight: '600' }]} numberOfLines={3}>
          {line.description || 'Freie Position'}
        </Text>
        <IconButton icon="trash-outline" label={`${line.description} entfernen`} color={colors.danger} onPress={onRemove} />
      </View>

      <View style={styles.bottom}>
        <NumberField
          style={{ flex: 1 }}
          label="Menge"
          suffix={line.unit}
          placeholder="0"
          value={line.quantity}
          onChange={(quantity) => onChange({ ...line, quantity })}
        />
        <View style={styles.totalBox}>
          <Pressable accessibilityRole="button" accessibilityLabel="Einzelpreis ändern" onPress={() => setEditPrice((open) => !open)} style={styles.priceButton}>
            <Text style={font.small}>× {formatEuro(line.unitPrice)}</Text>
            <Icon name="pencil" size={13} color={colors.textMuted} />
          </Pressable>
          <Text style={styles.total}>{formatEuro(lineTotal(line))}</Text>
        </View>
      </View>

      {editPrice ? (
        <MoneyField label="Einzelpreis (wie in der Preisliste)" value={line.unitPrice} onChange={(unitPrice) => onChange({ ...line, unitPrice })} />
      ) : null}
    </Card>
  );
}

const UNITS: { value: Unit; label: string }[] = [
  { value: 'Stk', label: 'Stück' },
  { value: 'm', label: 'Meter' },
  { value: '15 Min', label: '15 Min' },
];

/** One material line: all fields visible, because material has its own description and price. */
export function MaterialLineCard({ line, onChange, onRemove }: LineCardProps) {
  const belowMinimum = line.unitPrice < MIN_MATERIAL_UNIT_PRICE;
  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <TextField label="Bezeichnung" placeholder="z. B. Leerrohr" value={line.description} onChangeText={(description) => onChange({ ...line, description })} />
        </View>
        <IconButton icon="trash-outline" label={`${line.description || 'Material'} entfernen`} color={colors.danger} onPress={onRemove} />
      </View>
      <Segmented options={UNITS} value={line.unit} onChange={(unit) => onChange({ ...line, unit })} />
      <View style={styles.bottom}>
        <NumberField style={{ flex: 1 }} label="Menge" placeholder="0" value={line.quantity} onChange={(quantity) => onChange({ ...line, quantity })} />
        <MoneyField
          style={{ flex: 1 }}
          label="Einzelpreis"
          value={line.unitPrice}
          error={belowMinimum ? `Mindestens ${formatEuro(MIN_MATERIAL_UNIT_PRICE)}` : undefined}
          onChange={(unitPrice) => onChange({ ...line, unitPrice })}
        />
      </View>
      <View style={styles.sum}>
        <Text style={font.small}>Summe</Text>
        <Text style={styles.total}>{formatEuro(lineTotal(line))}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  code: { backgroundColor: colors.tealTint, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, marginTop: 2 },
  codeText: { fontSize: 13, fontWeight: '800', color: colors.tealDark, fontVariant: ['tabular-nums'] },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  totalBox: { alignItems: 'flex-end', gap: 4, minWidth: 110, paddingBottom: 12 },
  priceButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  total: { fontSize: 18, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
  sum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm },
});
