import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './Button';
import { Icon, type IconName } from './Icon';
import { colors, font, radius, shadow, space } from './theme';

/** Scrolling page with consistent padding that keeps inputs visible above the keyboard. */
export function Screen({
  children,
  footer,
  padded = true,
  bottomInset = true,
}: {
  children: React.ReactNode;
  /** Sticky bar under the content (primary actions). */
  footer?: React.ReactNode;
  padded?: boolean;
  bottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[padded && styles.content, { paddingBottom: (footer || !bottomInset ? space.lg : insets.bottom + space.xl) + 8 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

/** Page title with an optional back button and right-hand action. */
export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
      {onBack ? <IconButton icon="chevron-back" label="Zurück" color={colors.navy} onPress={onBack} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[onBack ? font.h2 : font.title]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={font.small} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export const goBack = (fallback: '/' | '/travel' = '/') => (router.canGoBack() ? router.back() : router.replace(fallback));

export function Card({ children, style, flat }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; flat?: boolean }) {
  return <View style={[styles.card, !flat && shadow, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={font.eyebrow}>{children.toUpperCase()}</Text>
      {right}
    </View>
  );
}

type Tone = 'neutral' | 'success' | 'warning' | 'teal' | 'danger';
const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.border, fg: colors.textSoft },
  success: { bg: colors.successTint, fg: colors.success },
  warning: { bg: colors.warningTint, fg: colors.warning },
  teal: { bg: colors.tealTint, fg: colors.tealDark },
  danger: { bg: colors.dangerTint, fg: colors.danger },
};

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** Tappable pill, used for quick-add buttons and filters. */
export function Chip({
  label,
  onPress,
  active,
  icon,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.7 }]}
    >
      {icon ? <Icon name={icon} size={16} color={active ? '#fff' : colors.tealDark} /> : null}
      <Text style={[styles.chipText, active && { color: '#fff' }, { flexShrink: 1 }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={34} color={colors.tealDark} />
      </View>
      <Text style={font.h3}>{title}</Text>
      <Text style={[font.small, { textAlign: 'center', maxWidth: 280 }]}>{text}</Text>
      {action}
    </View>
  );
}

/** Key/value line inside a card (totals, summaries). */
export function KeyValue({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={[font.body, { color: colors.textMuted }, strong && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      <Text style={[font.body, { fontVariant: ['tabular-nums'] }, strong && { fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

export function Notice({ tone = 'warning', children }: { tone?: 'warning' | 'danger' | 'teal'; children: React.ReactNode }) {
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Icon name={tone === 'teal' ? 'information-circle' : 'alert-circle'} size={20} color={fg} />
      <Text style={[styles.noticeText, { color: fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: space.lg, gap: space.lg },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space.lg, paddingBottom: space.sm, minHeight: 56 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '800' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.tealTint,
    maxWidth: 260,
  },
  chipActive: { backgroundColor: colors.navy },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.tealDark },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.tealTint, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  notice: { flexDirection: 'row', gap: 10, padding: space.md, borderRadius: radius.md, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
