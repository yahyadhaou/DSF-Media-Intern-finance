import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useCompany, useTravelStatement } from '../../../data/hooks';
import { PreviewScreen } from '../../../pdf/PreviewScreen';
import { buildTravelHtml } from '../../../pdf/travelHtml';
import { goBack } from '../../../ui/Layout';
import { colors } from '../../../ui/theme';

export default function TravelPreviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const statement = useTravelStatement(id).data;
  const company = useCompany().data;

  const html = useMemo(
    () => (statement && company ? { preview: buildTravelHtml(statement, company, 'preview'), print: buildTravelHtml(statement, company, 'print') } : null),
    [statement, company],
  );

  if (!html) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.tealDark} size="large" />
      </View>
    );
  }
  return (
    <PreviewScreen
      title="Fahrtkostenübersicht"
      subtitle="So sieht das PDF aus"
      previewHtml={html.preview}
      printHtmlSource={html.print}
      onBack={() => (router.canGoBack() ? goBack('/travel') : router.replace('/travel'))}
    />
  );
}
