import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { computeTravelTotals, formatEur, formatKm, formatTravelDate, tripAmount, roundTripKm, type TravelStatement } from '../../domain/travel';
import { useTravelActions } from '../../data/hooks';
import { Button } from '../../ui/Button';
import { confirm, errorMessage, notify } from '../../ui/dialogs';
import { Card, goBack, Header, KeyValue, Notice, Screen, SectionTitle } from '../../ui/Layout';
import { colors, font, space } from '../../ui/theme';

/** Read-only view of a finished travel statement. */
export function TravelDetail({ statement }: { statement: TravelStatement }) {
  const totals = computeTravelTotals(statement);
  const actions = useTravelActions();

  const reopen = async () => {
    const ok = await confirm({ title: 'Abrechnung bearbeiten?', message: 'Sie wird wieder zum Entwurf. Schließe sie danach erneut ab.', confirmLabel: 'Bearbeiten' });
    if (!ok) return;
    try {
      await actions.reopen(statement.id);
    } catch (error) {
      notify('Bearbeiten nicht möglich', errorMessage(error));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Fahrtkosten" subtitle="Abgeschlossen" onBack={() => goBack('/travel')} />
      <Screen
        footer={
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Bearbeiten" icon="create-outline" variant="secondary" onPress={() => void reopen()} style={{ flex: 1 }} />
            <Button label="PDF ansehen & teilen" icon="document-text" onPress={() => router.push({ pathname: '/travel/[id]/preview', params: { id: statement.id } })} style={{ flex: 1.6 }} />
          </View>
        }
      >
        <Notice tone="teal">Diese Abrechnung ist abgeschlossen und auf dem Gerät gespeichert. Mit „Bearbeiten“ kannst du sie jederzeit wieder ändern.</Notice>
        <Card>
          <KeyValue label="Fahrten (bestätigt)" value={`${totals.confirmed} von ${totals.trips}`} />
          <KeyValue label="Strecke hin & zurück" value={`${formatKm(totals.totalKm)} km`} />
          <KeyValue label="Gesamtbetrag" value={formatEur(totals.amount)} strong />
        </Card>
        <SectionTitle>Fahrten</SectionTitle>
        {statement.trips.map((trip, index) => (
          <Card key={trip.id} style={{ gap: 4, opacity: trip.confirmed ? 1 : 0.6 }}>
            <Text style={font.h3}>
              {index + 1}. {formatTravelDate(trip.date)}
            </Text>
            <Text style={font.body}>{trip.address || '–'}</Text>
            <Text style={{ ...font.small, color: colors.textMuted }}>
              {[trip.orderNumber, `${formatKm(roundTripKm(trip))} km`, formatEur(tripAmount(trip, statement.ratePerKm))].filter(Boolean).join(' · ')}
            </Text>
          </Card>
        ))}
      </Screen>
    </View>
  );
}
