import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, radius, TOUCH } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Fill the available width. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.navy, fg: '#FFFFFF', border: colors.navy },
  secondary: { bg: colors.surface, fg: colors.navy, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.tealDark, border: 'transparent' },
  danger: { bg: colors.dangerTint, fg: colors.danger, border: colors.dangerTint },
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, block, style }: ButtonProps) {
  const { bg, fg, border } = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        block && styles.block,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Round icon-only button (delete, close, ...). */
export function IconButton({
  icon,
  onPress,
  label,
  color = colors.textMuted,
  background,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  background?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.icon, background ? { backgroundColor: background } : null, pressed && { opacity: 0.6 }]}
    >
      <Icon name={icon} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  block: { alignSelf: 'stretch' },
  label: { fontSize: 16, fontWeight: '700' },
  icon: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
