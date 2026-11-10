import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, fromIsoDate, toIsoDate } from '../domain/dates';
import type { IsoDate } from '../domain/types';
import { Icon } from './Icon';
import { colors, font, radius, TOUCH } from './theme';

/** Date input: native calendar on Android, compact iOS picker on iPhone. Value is `YYYY-MM-DD`. */
export function DateField({ label, value, onChange }: { label: string; value: IsoDate; onChange: (value: IsoDate) => void }) {
  const date = fromIsoDate(value);

  if (Platform.OS === 'ios') {
    return (
      <View style={{ gap: 6, flex: 1 }}>
        <Text style={font.label}>{label}</Text>
        <View style={styles.box}>
          <Icon name="calendar-outline" size={20} color={colors.tealDark} />
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            locale="de-DE"
            accentColor={colors.tealDark}
            onValueChange={(_event, next) => onChange(toIsoDate(next))}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={font.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}`}
        style={styles.box}
        onPress={() =>
          DateTimePickerAndroid.open({
            value: date,
            mode: 'date',
            onValueChange: (_event, next) => onChange(toIsoDate(next)),
          })
        }
      >
        <Icon name="calendar-outline" size={20} color={colors.tealDark} />
        <Text style={styles.text}>{formatDate(value)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  text: { fontSize: 16, color: colors.text, fontWeight: '600' },
});
