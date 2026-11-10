import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, font, radius, TOUCH } from './theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

/** Pick exactly one of a few options (client, owner type, ...). Big, labelled, thumb-friendly. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={font.label}>{label}</Text> : null}
      <View style={styles.segmented} accessibilityRole="radiogroup">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.value)}
              style={[styles.segment, active && styles.segmentActive]}
            >
              {option.icon ? <Icon name={option.icon} size={18} color={active ? '#fff' : colors.textMuted} /> : null}
              <Text style={[styles.segmentText, active && { color: '#fff' }]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** A switch with a title and a plain-language explanation of what it does. */
export function SwitchRow({
  title,
  description,
  value,
  onChange,
  disabled,
}: {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={styles.switchRow}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.switchTitle}>{title}</Text>
        {description ? <Text style={font.small}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.borderStrong, true: colors.teal }}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}

/** Small round − / + control around a number. */
export function Stepper({ value, onChange, min = 0, label }: { value: number; onChange: (value: number) => void; min?: number; label: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} verringern`}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.stepButton}
      >
        <Icon name="remove" size={20} color={colors.navy} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} erhöhen`}
        onPress={() => onChange(value + 1)}
        style={[styles.stepButton, { backgroundColor: colors.navy }]}
      >
        <Icon name="add" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    minHeight: TOUCH - 8,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentActive: { backgroundColor: colors.navy },
  segmentText: { fontSize: 14, fontWeight: '700', color: colors.textSoft },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH, paddingVertical: 8 },
  switchTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  stepper: { flexDirection: 'row', gap: 8 },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
