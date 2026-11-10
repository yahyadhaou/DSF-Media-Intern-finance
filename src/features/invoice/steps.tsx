import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { addCatalogLine, addFreeTextLine, lineNetAmounts, sortByCode, suggestMaterialLines } from '../../domain/calc';
import { CLIENT_NAMES, DEFAULT_PLATFORM_FEE_RATE, MIN_MATERIAL_UNIT_PRICE, PLATFORM_FEE_LABEL } from '../../domain/constants';
import { formatEuro } from '../../domain/money';
import type { CatalogItem, ClientKind, Invoice, InvoiceLine, InvoiceTotals, OwnerKind } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Segmented, SwitchRow } from '../../ui/Controls';
import { DateField } from '../../ui/DateField';
import { MoneyField, NumberField, TextField } from '../../ui/Field';
import { Card, Chip, EmptyState, KeyValue, SectionTitle } from '../../ui/Layout';
import { colors, font, space } from '../../ui/theme';
import { CatalogPicker } from './CatalogPicker';
import { MaterialLineCard, ServiceLineCard } from './LineCards';

export interface StepProps {
  invoice: Invoice;
  update: (change: (invoice: Invoice) => Invoice) => void;
  catalog: CatalogItem[];
}

// --- 1. Auftrag -----------------------------------------------------------------------------

export function OrderStep({ invoice, update }: StepProps) {
  const { client } = invoice;
  const setKind = (kind: ClientKind) =>
    update((current) => {
      const wasPreset = current.client.name === CLIENT_NAMES[current.client.kind];
      return { ...current, client: { ...current.client, kind, name: kind === 'other' ? (wasPreset ? '' : current.client.name) : CLIENT_NAMES[kind] } };
    });
  const setFrom = (from: string) => update((current) => ({ ...current, executionFrom: from, executionTo: current.executionTo < from ? from : current.executionTo }));
  const setTo = (to: string) => update((current) => ({ ...current, executionTo: to, executionFrom: current.executionFrom > to ? to : current.executionFrom }));

  return (
    <>
      <SectionTitle>Auftraggeber</SectionTitle>
      <Card>
        <Segmented
          value={client.kind}
          onChange={setKind}
          options={[
            { value: 'telekom', label: 'Telekom' },
            { value: 'vodafone', label: 'Vodafone' },
            { value: 'other', label: 'Andere' },
          ]}
        />
        {client.kind === 'other' ? (
          <TextField label="Name des Auftraggebers" value={client.name} onChangeText={(name) => update((c) => ({ ...c, client: { ...c.client, name } }))} autoCapitalize="words" />
        ) : null}
        <TextField label="Straße und Hausnummer" value={client.street} autoComplete="street-address" onChangeText={(street) => update((c) => ({ ...c, client: { ...c.client, street } }))} />
        <View style={styles.pair}>
          <TextField style={{ flex: 1 }} label="PLZ" value={client.zip} keyboardType="number-pad" autoComplete="postal-code" maxLength={5} onChangeText={(zip) => update((c) => ({ ...c, client: { ...c.client, zip } }))} />
          <TextField style={{ flex: 2 }} label="Ort" value={client.city} autoCapitalize="words" onChangeText={(city) => update((c) => ({ ...c, client: { ...c.client, city } }))} />
        </View>
      </Card>

      <SectionTitle>Auftrag</SectionTitle>
      <Card>
        <TextField label="Auftrags-Nr." hint="Optional" autoCapitalize="characters" value={invoice.orderNumber} onChangeText={(orderNumber) => update((c) => ({ ...c, orderNumber }))} />
        <TextField label="Bestell-Nr." hint="Optional" autoCapitalize="characters" value={invoice.purchaseOrderNumber} onChangeText={(purchaseOrderNumber) => update((c) => ({ ...c, purchaseOrderNumber }))} />
        <View style={styles.pair}>
          <DateField label="Leistung von" value={invoice.executionFrom} onChange={setFrom} />
          <DateField label="bis" value={invoice.executionTo} onChange={setTo} />
        </View>
      </Card>
    </>
  );
}

// --- 2. Objekt ------------------------------------------------------------------------------

export function ObjectStep({ invoice, update }: StepProps) {
  const { owner } = invoice;
  return (
    <>
      <SectionTitle>Hauseigentümer / Objekt</SectionTitle>
      <Card>
        <Segmented
          value={owner.kind}
          onChange={(kind: OwnerKind) => update((c) => ({ ...c, owner: { ...c.owner, kind } }))}
          options={[
            { value: 'private', label: 'Privatperson', icon: 'person-outline' },
            { value: 'company', label: 'Firma', icon: 'business-outline' },
          ]}
        />
        <TextField label={owner.kind === 'private' ? 'Name' : 'Firmenname'} autoCapitalize="words" value={owner.name} onChangeText={(name) => update((c) => ({ ...c, owner: { ...c.owner, name } }))} />
        <TextField label="Straße und Hausnummer" value={owner.street} autoComplete="street-address" onChangeText={(street) => update((c) => ({ ...c, owner: { ...c.owner, street } }))} />
        <View style={styles.pair}>
          <TextField style={{ flex: 1 }} label="PLZ" value={owner.zip} keyboardType="number-pad" autoComplete="postal-code" maxLength={5} onChangeText={(zip) => update((c) => ({ ...c, owner: { ...c.owner, zip } }))} />
          <TextField style={{ flex: 2 }} label="Ort" value={owner.city} autoCapitalize="words" onChangeText={(city) => update((c) => ({ ...c, owner: { ...c.owner, city } }))} />
        </View>
      </Card>
    </>
  );
}

// --- 3. Leistungen --------------------------------------------------------------------------

export function ServicesStep({ invoice, update, catalog }: StepProps) {
  const [picker, setPicker] = useState(false);
  const frequent = useMemo(() => catalog.filter((item) => item.kind === 'service' && item.active && item.frequent), [catalog]);
  const counts = useMemo(() => Object.fromEntries(invoice.serviceLines.map((line) => [line.catalogItemId ?? '', line.quantity])), [invoice.serviceLines]);
  const lines = useMemo(() => sortByCode(invoice.serviceLines), [invoice.serviceLines]);
  const fee = invoice.platformFee;

  const add = (item: CatalogItem) => update((c) => ({ ...c, serviceLines: addCatalogLine(item, c.serviceLines) }));
  const change = (next: InvoiceLine) => update((c) => ({ ...c, serviceLines: c.serviceLines.map((line) => (line.id === next.id ? next : line)) }));
  const remove = (id: string) => update((c) => ({ ...c, serviceLines: c.serviceLines.filter((line) => line.id !== id) }));

  return (
    <>
      <SectionTitle>Schnell hinzufügen</SectionTitle>
      {/* One swipeable row: the position list below stays visible. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        {frequent.map((item) => (
          <Chip key={item.id} label={`${item.code ? item.code.slice(3) : ''} ${item.name}`.trim()} icon="add" onPress={() => add(item)} />
        ))}
      </ScrollView>
      <Button label="Alle Positionen durchsuchen" icon="search" variant="secondary" onPress={() => setPicker(true)} block />

      <SectionTitle>{`Erbrachte Leistungen (${lines.length})`}</SectionTitle>
      {lines.length === 0 ? (
        <Card flat>
          <EmptyState icon="construct-outline" title="Noch keine Leistung" text="Tippe oben auf eine Position. Mehrfaches Tippen erhöht die Menge." />
        </Card>
      ) : (
        lines.map((line) => <ServiceLineCard key={line.id} line={line} onChange={change} onRemove={() => remove(line.id)} />)
      )}

      <SectionTitle>{PLATFORM_FEE_LABEL}</SectionTitle>
      <Card>
        <SwitchRow
          title={`${PLATFORM_FEE_LABEL} abziehen`}
          description="Tagesgebühr, wird vom Nettobetrag abgezogen."
          value={fee.days > 0}
          onChange={(on) => update((c) => ({ ...c, platformFee: { ...c.platformFee, days: on ? Math.max(1, c.platformFee.days) : 0 } }))}
        />
        {fee.days > 0 ? (
          <View style={styles.pair}>
            <NumberField style={{ flex: 1 }} label="Tage" suffix="Tage" value={fee.days} onChange={(days) => update((c) => ({ ...c, platformFee: { ...c.platformFee, days } }))} />
            <MoneyField
              style={{ flex: 1 }}
              label="Netto pro Tag"
              value={fee.dailyRate}
              onChange={(dailyRate) => update((c) => ({ ...c, platformFee: { ...c.platformFee, dailyRate: dailyRate || DEFAULT_PLATFORM_FEE_RATE } }))}
            />
          </View>
        ) : null}
      </Card>

      <CatalogPicker visible={picker} kind="service" items={catalog} counts={counts} onPick={add} onClose={() => setPicker(false)} />
    </>
  );
}

// --- 4. Material ----------------------------------------------------------------------------

export function MaterialStep({ invoice, update, catalog }: StepProps) {
  const [picker, setPicker] = useState(false);
  const counts = useMemo(() => Object.fromEntries(invoice.materialLines.map((line) => [line.catalogItemId ?? '', line.quantity])), [invoice.materialLines]);
  const suggestions = useMemo(
    () => suggestMaterialLines(invoice.serviceLines, catalog, invoice.materialLines).length - invoice.materialLines.length,
    [invoice.serviceLines, invoice.materialLines, catalog],
  );

  const add = (item: CatalogItem) => update((c) => ({ ...c, materialLines: addCatalogLine(item, c.materialLines) }));
  const change = (next: InvoiceLine) => update((c) => ({ ...c, materialLines: c.materialLines.map((line) => (line.id === next.id ? next : line)) }));
  const remove = (id: string) => update((c) => ({ ...c, materialLines: c.materialLines.filter((line) => line.id !== id) }));

  return (
    <>
      <View style={styles.pair}>
        <Button label="Aus Liste" icon="list" variant="secondary" style={{ flex: 1 }} onPress={() => setPicker(true)} />
        <Button label="Eigene Zeile" icon="create-outline" variant="secondary" style={{ flex: 1 }} onPress={() => update((c) => ({ ...c, materialLines: addFreeTextLine(c.materialLines, MIN_MATERIAL_UNIT_PRICE) }))} />
      </View>
      {suggestions > 0 ? (
        <Button
          label={`${suggestions} passende${suggestions === 1 ? 's' : ''} Material vorschlagen`}
          icon="sparkles"
          variant="ghost"
          onPress={() => update((c) => ({ ...c, materialLines: suggestMaterialLines(c.serviceLines, catalog, c.materialLines) }))}
          block
        />
      ) : null}

      <SectionTitle>{`Verbrauchtes Material (${invoice.materialLines.length})`}</SectionTitle>
      {invoice.materialLines.length === 0 ? (
        <Card flat>
          <EmptyState icon="cube-outline" title="Kein Material" text="Dieser Schritt ist optional. Du kannst ihn überspringen." />
        </Card>
      ) : (
        invoice.materialLines.map((line) => <MaterialLineCard key={line.id} line={line} onChange={change} onRemove={() => remove(line.id)} />)
      )}

      <CatalogPicker visible={picker} kind="material" items={catalog} counts={counts} onPick={add} onClose={() => setPicker(false)} />
    </>
  );
}

// --- 5. Abschluss ---------------------------------------------------------------------------

export function FinishStep({
  invoice,
  update,
  totals,
  problems,
  hasBankDetails,
}: Omit<StepProps, 'catalog'> & {
  totals: InvoiceTotals;
  problems: string[];
  hasBankDetails: boolean;
}) {
  // Same net figures as the PDF (gross prices are split into net lines).
  const net = lineNetAmounts(invoice);
  const netServices = net.service.reduce((sum, value) => sum + value, 0);
  const netMaterial = net.material.reduce((sum, value) => sum + value, 0);
  return (
    <>
      <SectionTitle>Optionen für das PDF</SectionTitle>
      <Card>
        <SwitchRow
          title="Preise enthalten USt."
          description="Die Preise der Preisliste sind Brutto. Aus der Summe wird das Netto herausgerechnet."
          value={invoice.pricesIncludeVat}
          onChange={(pricesIncludeVat) => update((c) => ({ ...c, pricesIncludeVat }))}
        />
        <SwitchRow
          title="19 % USt. ausweisen"
          description="Aus: keine USt.-Zeile, Gesamtbetrag = Nettobetrag."
          value={invoice.chargeVat}
          onChange={(chargeVat) => update((c) => ({ ...c, chargeVat }))}
        />
        <SwitchRow
          title="Hinweis § 13b UStG"
          description="Druckt den Satz zur Steuerschuldnerschaft des Leistungsempfängers."
          value={invoice.reverseChargeNote}
          onChange={(reverseChargeNote) => update((c) => ({ ...c, reverseChargeNote }))}
        />
        <SwitchRow
          title="Bankverbindung drucken"
          description={hasBankDetails ? 'IBAN, BIC … aus den Einstellungen.' : 'Erst unter Einstellungen → Bank eintragen.'}
          value={invoice.showBankDetails}
          onChange={(showBankDetails) => update((c) => ({ ...c, showBankDetails }))}
        />
      </Card>

      <SectionTitle>Zusammenfassung</SectionTitle>
      <Card>
        <KeyValue label="Summe Leistungen" value={formatEuro(netServices)} />
        <KeyValue label="Summe Material" value={formatEuro(netMaterial)} />
        {totals.platformFee > 0 ? <KeyValue label={`abzgl. ${PLATFORM_FEE_LABEL}`} value={formatEuro(-totals.platformFee)} /> : null}
        <View style={styles.rule} />
        <KeyValue label="Nettobetrag" value={formatEuro(totals.net)} strong />
        {invoice.chargeVat ? <KeyValue label={`zzgl. ${Math.round(invoice.vatRate * 100)} % USt.`} value={formatEuro(totals.vat)} /> : null}
        <View style={styles.grand}>
          <Text style={styles.grandLabel}>GESAMTBETRAG</Text>
          <Text style={styles.grandValue}>{formatEuro(totals.gross)}</Text>
        </View>
      </Card>

      {problems.length > 0 ? (
        <Card flat style={{ backgroundColor: colors.warningTint }}>
          <Text style={[font.h3, { color: colors.warning }]}>Zum Ausstellen fehlt noch:</Text>
          {problems.map((problem) => (
            <Text key={problem} style={{ color: colors.warning, fontSize: 15 }}>
              • {problem}
            </Text>
          ))}
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  // Bleed to the screen edges (the page has 16 pt padding) so chips scroll under the edge.
  chipScroll: { marginHorizontal: -space.lg, flexGrow: 0 },
  chips: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg },
  rule: { height: 1, backgroundColor: colors.border },
  grand: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  grandLabel: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.6 },
  grandValue: { color: '#fff', fontWeight: '800', fontSize: 22, fontVariant: ['tabular-nums'] },
});
