import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, radius, shadow } from './theme';

/** The one big "create" button of a list screen, always reachable with the thumb. */
export function Fab({ label, icon = 'add', onPress }: { label: string; icon?: IconName; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.fab, shadow, pressed && { opacity: 0.88 }]}>
      <Icon name={icon} size={24} color="#fff" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    height: 56,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
