import { Tabs } from 'expo-router/js-tabs';
import { Platform, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../ui/Icon';
import { colors } from '../../ui/theme';

const tab = (title: string, active: IconName, inactive: IconName) => ({
  title,
  tabBarIcon: ({ focused, color }: { focused: boolean; color: ColorValue }) => <Icon name={focused ? active : inactive} size={24} color={color} />,
});

/** Five tabs, always visible: the whole app is one tap away. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58 + Math.max(insets.bottom, Platform.OS === 'web' ? 0 : 8),
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={tab('Rechnungen', 'document-text', 'document-text-outline')} />
      <Tabs.Screen name="travel" options={tab('Fahrten', 'car', 'car-outline')} />
      <Tabs.Screen name="stats" options={tab('Statistik', 'stats-chart', 'stats-chart-outline')} />
      <Tabs.Screen name="prices" options={tab('Preise', 'pricetags', 'pricetags-outline')} />
      <Tabs.Screen name="settings" options={tab('Einstellungen', 'settings', 'settings-outline')} />
    </Tabs>
  );
}
