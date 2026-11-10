import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTravelActions } from '../../data/hooks';
import {
  computeTravelTotals,
  createTrip,
  formatDuration,
  formatEur,
  formatKm,
  roundTripKm,
  tripAmount,
  type TravelStatement,
  type TravelTrip,
} from '../../domain/travel';
import { Button, IconButton } from '../../ui/Button';
import { SwitchRow } from '../../ui/Controls';
import { confirm, errorMessage, notify } from '../../ui/dialogs';
import { DateField } from '../../ui/DateField';
import { MoneyField, NumberField, TextField } from '../../ui/Field';
import { Card, goBack, Header, Screen, SectionTitle } from '../../ui/Layout';
import { colors, font, radius, space } from '../../ui/theme';
import { useAutosave, type SaveState } from '../useAutosave';

const SAVE_TEXT: Record<SaveState, string> = {
  idle: 'Speichert automatisch',
  saving: 'Speichert …',
  saved: 'Gespeichert ✓',
  error: 'Speichern fehlgeschlagen',
};

function DurationField({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (
    <View style={styles.pair}>
      <NumberField style={{ flex: 1 }} label="Fahrdauer" suffix="Std." value={hours} onChange={(h) => onChange(Math.max(0, Math.floor(h)) * 60 + rest)} />
      <NumberField style={{ flex: 1 }} label=" " suffix="Min." value={rest} onChange={(m) => onChange(hours * 60 + Math.min(59, Math.max(0, Math.floor(m))))} />
    </View>
  );
}

function TripCard({
  trip,
  index,
  statement,
  onChange,
  onRemove,
}: {
  trip: TravelTrip;
  index: number;
  statement: TravelStatement;
  onChange: (trip: TravelTrip) => void;
  onRemove: () => void;
}) {
  return (
    <Card style={!trip.confirmed ? { opacity: 0.75 } : undefined}>
      <View style={styles.tripHead}>
        <View style={styles.tripNumber}>
          <Text style={styles.tripNumberText}>{index + 1}</Text>
        </View>
        <Text style={[font.h3, { flex: 1 }]}>{trip.confirmed ? 'Fahrt' : 'Fahrt (nicht bestätigt)'}</Text>
        <IconButton icon="trash-outline" label={`Fahrt ${index + 1} entfernen`} color={colors.danger} onPress={onRemove} />
      </View>

      <DateField label="Datum" value={trip.date} onChange={(date) => onChange({ ...trip, date })} />
      <TextField label="Zieladresse" value={trip.address} placeholder="Straße, PLZ Ort" autoCapitalize="words" onChangeText={(address) => onChange({ ...trip, address })} />
      <View style={styles.pair}>
        <TextField style={{ flex: 1 }} label="Auftrags-Nr." autoCapitalize="characters" value={trip.orderNumber} onChangeText={(orderNumber) => onChange({ ...trip, orderNumber })} />
        <NumberField style={{ flex: 1 }} label="Einfach" suffix="km" placeholder="0" value={trip.singleKm} onChange={(singleKm) => onChange({ ...trip, singleKm })} />
      </View>
      {statement.showClient ? <TextField label="Kunde" autoCapitalize="words" value={trip.client} onChangeText={(client) => onChange({ ...trip, client })} /> : null}
      {statement.showDuration ? <DurationField minutes={trip.durationMinutes} onChange={(durationMinutes) => onChange({ ...trip, durationMinutes })} /> : null}
      <SwitchRow title="Bestätigt" description="Nur bestätigte Fahrten zählen mit." value={trip.confirmed} onChange={(confirmed) => onChange({ ...trip, confirmed })} />

      <View style={styles.tripSum}>
        <Text style={font.small}>Hin & zurück {formatKm(roundTripKm(trip))} km</Text>
        <Text style={styles.tripAmount}>{formatEur(tripAmount(trip, statement.ratePerKm))}</Text>
      </View>
    </Card>
  );
}

/** Travel statement editor: one scrolling page, big total on top, autosaved. */
export function TravelEditor({ initial }: { initial: TravelStatement }) {
  const actions = useTravelActions();
  const [statement, setStatement] = useState(initial);
  const [finalizing, setFinalizing] = useState(false);
  const [startedNew] = useState(() => initial.createdAt === initial.updatedAt);
  const persisted = useRef(!startedNew);

  const save = useCallback(
    async (value: TravelStatement) => {
      const saved = await actions.save(value);
      persisted.current = true;
      return saved;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const { state, flush } = useAutosave(statement, save, { enabled: true });
  const totals = useMemo(() => computeTravelTotals(statement), [statement]);

  const update = (change: (value: TravelStatement) => TravelStatement) => setStatement(change);
  const setTrip = (next: TravelTrip) => update((s) => ({ ...s, trips: s.trips.map((trip) => (trip.id === next.id ? next : trip)) }));
  const removeTrip = (id: string) => update((s) => ({ ...s, trips: s.trips.filter((trip) => trip.id !== id) }));
  const addTrip = () => update((s) => ({ ...s, trips: [...s.trips, createTrip(s.trips[s.trips.length - 1])] }));

  const persist = async () => {
    await flush();
    if (!persisted.current) await save(statement);
  };

  const openPreview = async () => {
    try {
      await persist();
      router.push({ pathname: '/travel/[id]/preview', params: { id: statement.id } });
    } catch (error) {
      notify('Vorschau nicht möglich', errorMessage(error));
    }
  };

  const finalize = async () => {
    const ok = await confirm({
      title: 'Abrechnung abschließen?',
      message: 'Danach kann sie nicht mehr geändert werden. Du kannst sie aber jederzeit als PDF teilen.',
      confirmLabel: 'Abschließen',
    });
    if (!ok) return;
    setFinalizing(true);
    try {
      await persist();
      await actions.finalize(statement.id);
    } catch (error) {
      notify('Abschließen nicht möglich', errorMessage(error));
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={startedNew ? 'Neue Fahrtkosten' : 'Fahrtkosten'}
        subtitle={SAVE_TEXT[state]}
        onBack={() => goBack('/travel')}
        right={<IconButton icon="eye-outline" label="PDF-Vorschau" color={colors.navy} onPress={() => void openPreview()} />}
      />
      <Screen
        footer={
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Abschließen" icon="checkmark-circle" variant="secondary" loading={finalizing} onPress={() => void finalize()} style={{ flex: 1 }} />
            <Button label="PDF ansehen" icon="document-text" onPress={() => void openPreview()} style={{ flex: 1.3 }} />
          </View>
        }
      >
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>GESAMTBETRAG</Text>
          <Text style={styles.summaryAmount}>{formatEur(totals.amount)}</Text>
          <Text style={styles.summaryMeta}>
            {totals.confirmed} von {totals.trips} Fahrten · {formatKm(totals.totalKm)} km
            {statement.showDuration && totals.durationMinutes > 0 ? ` · ${formatDuration(totals.durationMinutes)}` : ''}
          </Text>
        </View>

        <SectionTitle>Grundlagen</SectionTitle>
        <Card>
          <TextField label="Startadresse" value={statement.startAddress} autoCapitalize="words" onChangeText={(startAddress) => update((s) => ({ ...s, startAddress }))} />
          <MoneyField label="Satz pro Kilometer" hint="Hin- und Rückfahrt × Satz" value={statement.ratePerKm} onChange={(ratePerKm) => update((s) => ({ ...s, ratePerKm }))} />
          <SwitchRow title="Spalte „Kunde“ im PDF" value={statement.showClient} onChange={(showClient) => update((s) => ({ ...s, showClient }))} />
          <SwitchRow title="Spalte „Fahrdauer“ im PDF" value={statement.showDuration} onChange={(showDuration) => update((s) => ({ ...s, showDuration }))} />
        </Card>

        <SectionTitle>{`Fahrten (${statement.trips.length})`}</SectionTitle>
        {statement.trips.map((trip, index) => (
          <TripCard key={trip.id} trip={trip} index={index} statement={statement} onChange={setTrip} onRemove={() => removeTrip(trip.id)} />
        ))}
        <Button label="Fahrt hinzufügen" icon="add" variant="secondary" onPress={addTrip} block />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  summary: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: space.lg, gap: 2 },
  summaryLabel: { color: colors.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  summaryAmount: { color: '#fff', fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryMeta: { color: '#B6C4D2', fontSize: 14 },
  tripHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tripNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.tealTint, alignItems: 'center', justifyContent: 'center' },
  tripNumberText: { color: colors.tealDark, fontWeight: '800' },
  tripSum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm },
  tripAmount: { fontSize: 18, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
});
