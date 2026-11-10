import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useInvoices, useTravelList } from '../../data/hooks';
import { formatEuro, formatQuantity } from '../../domain/money';
import { availableYears, MONTH_SHORT, monthLabel, monthlyStats, yearStats, type MonthKey, type MonthStats } from '../../domain/stats';
import { formatKm } from '../../domain/travel';
import { Icon, type IconName } from '../../ui/Icon';
import { Card, Chip, EmptyState, Header, KeyValue, Screen, SectionTitle } from '../../ui/Layout';
import { colors, font, radius, space } from '../../ui/theme';

/** Tablets get four figures per row, phones two. */
const WIDE = 720;

function Kpi({ icon, label, value, hint, width }: { icon: IconName; label: string; value: string; hint?: string; width: number }) {
  return (
    <Card style={[styles.kpi, { width }]}>
      <View style={styles.kpiIcon}>
        <Icon name={icon} size={20} color={colors.tealDark} />
      </View>
      <Text style={font.eyebrow}>{label.toUpperCase()}</Text>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={font.small}>{hint}</Text> : null}
    </Card>
  );
}

/** Net amount per month as simple bars; tap a bar to see that month. */
function YearChart({ values, year, selected, onSelect }: { values: number[]; year: number; selected: MonthKey; onSelect: (key: MonthKey) => void }) {
  const max = Math.max(...values, 1);
  return (
    <Card>
      <Text style={font.h3}>Umsatz netto pro Monat</Text>
      <View style={styles.chart}>
        {values.map((value, index) => {
          const key = `${year}-${String(index + 1).padStart(2, '0')}`;
          const active = key === selected;
          return (
            <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${monthLabel(key)}: ${formatEuro(value)}`} onPress={() => onSelect(key)} style={styles.barSlot}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${Math.max(value > 0 ? 4 : 0, (value / max) * 100)}%` }, active && styles.barActive]} />
              </View>
              <Text style={[styles.barLabel, active && { color: colors.navy, fontWeight: '800' }]}>{MONTH_SHORT[index]}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function MonthDetail({ month, tileWidth }: { month: MonthStats | undefined; tileWidth: number }) {
  if (!month) {
    return (
      <Card>
        <Text style={font.body}>In diesem Monat gibt es noch keine Rechnung und keine Fahrt.</Text>
      </Card>
    );
  }
  return (
    <Card>
      <Text style={font.h2}>{monthLabel(month.key)}</Text>
      <KeyValue label="Rechnungen ausgestellt" value={String(month.issued)} />
      <KeyValue label="Umsatz netto" value={formatEuro(month.net)} strong />
      {month.gross !== month.net ? <KeyValue label="Umsatz brutto" value={formatEuro(month.gross)} /> : null}
      {month.drafts > 0 ? <KeyValue label={`Offene Entwürfe (${month.drafts})`} value={formatEuro(month.openGross)} /> : null}
      <View style={styles.divider} />
      <KeyValue label="Fahrten (bestätigt)" value={String(month.trips)} />
      <KeyValue label="Kilometer hin & zurück" value={`${formatKm(month.km)} km`} />
      <KeyValue label="Fahrtkosten" value={formatEuro(month.travelAmount)} strong />
      {month.quantities.length > 0 ? (
        <>
          <View style={styles.divider} />
          <Text style={font.label}>Geleistete Arbeit</Text>
          <View style={styles.tiles}>
            {month.quantities.map((quantity) => (
              <View key={quantity.label} style={[styles.tile, { width: tileWidth }]}>
                <Text style={styles.tileLabel} numberOfLines={2}>
                  {quantity.label.toUpperCase()}
                </Text>
                <Text style={styles.tileValue}>
                  {formatQuantity(quantity.quantity)} <Text style={styles.tileUnit}>{quantity.unit}</Text>
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Card>
  );
}

export default function StatsScreen() {
  const invoices = useInvoices();
  const travel = useTravelList();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;

  const months = useMemo(() => monthlyStats(invoices.data ?? [], travel.data ?? []), [invoices.data, travel.data]);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => availableYears(months, currentYear), [months, currentYear]);
  const [year, setYear] = useState(currentYear);
  const summary = useMemo(() => yearStats(months, year), [months, year]);
  const monthsOfYear = months.filter((entry) => entry.key.startsWith(`${year}-`));

  const [picked, setPicked] = useState<MonthKey | null>(null);
  // Default: the newest month of the chosen year that has data, otherwise the current month.
  const selected = picked?.startsWith(`${year}-`) ? picked : (monthsOfYear[0]?.key ?? `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  const content = Math.min(width, 1100) - space.lg * 2;
  const kpiWidth = (content - space.md * ((wide ? 4 : 2) - 1)) / (wide ? 4 : 2) - 0.5;
  const detailWidth = wide ? content * 0.58 : content;
  const tileWidth = (detailWidth - space.lg * 2 - space.sm * ((wide ? 3 : 2) - 1)) / (wide ? 3 : 2) - 0.5;

  if (invoices.isLoading || travel.isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Statistik" />
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.tealDark} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title="Statistik" subtitle="Deine Arbeit Monat für Monat – alles auf diesem Gerät gespeichert" />
      {months.length === 0 ? (
        <EmptyState icon="stats-chart-outline" title="Noch keine Zahlen" text="Sobald du Rechnungen oder Fahrtkosten erfasst, siehst du hier deine Monate." />
      ) : (
        <Screen>
          <View style={[styles.page, { maxWidth: 1100 }]}>
            <View style={styles.years}>
              {years.map((entry) => (
                <Chip key={entry} label={String(entry)} active={entry === year} onPress={() => setYear(entry)} />
              ))}
            </View>

            <View style={styles.kpis}>
              <Kpi width={kpiWidth} icon="cash-outline" label={`Umsatz ${year}`} value={formatEuro(summary.net)} hint="netto, ausgestellt" />
              <Kpi
                width={kpiWidth}
                icon="document-text-outline"
                label="Rechnungen"
                value={String(summary.issued)}
                hint={summary.drafts > 0 ? `+ ${summary.drafts} Entwürfe (${formatEuro(summary.openGross)})` : 'ausgestellt'}
              />
              <Kpi width={kpiWidth} icon="car-outline" label="Fahrten" value={String(summary.trips)} hint={`${formatKm(summary.km)} km`} />
              <Kpi width={kpiWidth} icon="wallet-outline" label="Fahrtkosten" value={formatEuro(summary.travelAmount)} hint={`${year}`} />
            </View>

            <YearChart values={summary.netByMonth} year={year} selected={selected} onSelect={setPicked} />

            <View style={wide ? styles.columns : styles.stack}>
              <View style={{ width: detailWidth, gap: space.md }}>
                <SectionTitle>Monat im Detail</SectionTitle>
                <MonthDetail month={months.find((entry) => entry.key === selected)} tileWidth={tileWidth} />
              </View>

              <View style={{ flex: 1, gap: space.md }}>
                <SectionTitle>{`Alle Monate ${year}`}</SectionTitle>
                {monthsOfYear.length === 0 ? <Text style={font.small}>Keine Daten in {year}.</Text> : null}
                {monthsOfYear.map((entry) => (
                  <Pressable key={entry.key} accessibilityRole="button" onPress={() => setPicked(entry.key)}>
                    <Card style={[styles.monthRow, entry.key === selected && styles.monthRowActive]} flat>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={font.h3}>{monthLabel(entry.key)}</Text>
                        <Text style={font.small}>
                          {entry.issued} Rechnungen{entry.drafts ? ` · ${entry.drafts} Entwürfe` : ''} · {entry.trips} Fahrten · {formatKm(entry.km)} km
                        </Text>
                      </View>
                      <Text style={styles.monthAmount}>{formatEuro(entry.net)}</Text>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Screen>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', alignSelf: 'center', gap: space.lg },
  years: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  kpi: { gap: 4, padding: space.md },
  kpiIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.tealTint, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 170, gap: 6 },
  barSlot: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.teal, borderRadius: radius.sm },
  barActive: { backgroundColor: colors.navy },
  barLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  columns: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' },
  stack: { gap: space.lg },
  divider: { height: 1, backgroundColor: colors.border },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { backgroundColor: colors.bg, borderTopWidth: 2, borderTopColor: colors.teal, borderRadius: radius.sm, padding: space.sm, gap: 2 },
  tileLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.4 },
  tileValue: { fontSize: 20, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
  tileUnit: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderWidth: 2, borderColor: 'transparent' },
  monthRowActive: { borderColor: colors.teal },
  monthAmount: { fontSize: 16, fontWeight: '800', color: colors.navy, fontVariant: ['tabular-nums'] },
});
