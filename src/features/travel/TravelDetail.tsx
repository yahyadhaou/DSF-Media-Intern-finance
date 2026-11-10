import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { computeTravelTotals, formatEur, formatKm, formatTravelDate, tripAmount, roundTripKm, type TravelStatement } from '../../domain/travel';
import { Button } from '../../ui/Button';
import { Card, goBack, Header, KeyValue, Notice, Screen, SectionTitle } from '../../ui/Layout';
import { colors, font } from '../../ui/theme';

/** Read-only view of a finished travel statement. */
export function TravelDetail({ statement }: { statement: TravelStatement }) {
  const totals = computeTravelTotals(statement);
  return (
    <View style={{ flex: 1 }}>
      <Header title="Fahrtkosten" subtitle="Abgeschlossen" onBack={() => goBack('/travel')} />
      <Screen footer={<Button label="PDF ansehen & teilen" icon="document-text" onPress={() => router.push({ pathname: '/travel/[id]/preview', params: { id: statement.id } })} block />}>
        <Notice tone="teal">Diese Abrechnung ist abgeschlossen und kann nicht mehr geändert werden.</Notice>
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
