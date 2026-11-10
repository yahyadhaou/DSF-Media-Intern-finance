import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCompany, useTravelStatement } from '../../../data/hooks';
import type { CompanySettings } from '../../../domain/types';
import { createEmptyTravelStatement, type TravelStatement } from '../../../domain/travel';
import { TravelDetail } from '../../../features/travel/TravelDetail';
import { TravelEditor } from '../../../features/travel/TravelEditor';
import { Button } from '../../../ui/Button';
import { EmptyState } from '../../../ui/Layout';
import { colors } from '../../../ui/theme';

/** Editor while the statement is a draft, read-only view once it is finalized. */
function TravelHost({ initial }: { initial: TravelStatement }) {
  const live = useTravelStatement(initial.id).data;
  if (live?.status === 'final') return <TravelDetail statement={live} />;
  return <TravelEditor initial={initial} />;
}

/** The statement is created once, when the screen opens; it is only stored after the first change. */
function NewTravel({ company }: { company: CompanySettings }) {
  const [draft] = useState(() => createEmptyTravelStatement(`${company.street}, ${company.zip} ${company.city}`, company.travelRatePerKm));
  return <TravelHost initial={draft} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

/** `/travel/new` starts a fresh statement; `/travel/<id>` opens an existing one. */
export default function TravelRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const company = useCompany();
  const stored = useTravelStatement(id);

  if (!company.data || (id !== 'new' && stored.isLoading)) {
    return (
      <Centered>
        <ActivityIndicator color={colors.tealDark} size="large" />
      </Centered>
    );
  }
  if (id === 'new') return <NewTravel company={company.data} />;
  if (!stored.data) {
    return (
      <Centered>
        <EmptyState
          icon="alert-circle-outline"
          title="Abrechnung nicht gefunden"
          text="Sie wurde vielleicht gelöscht."
          action={<Button label="Zur Übersicht" onPress={() => router.replace('/travel')} />}
        />
      </Centered>
    );
  }
  return <TravelHost initial={stored.data} />;
}
