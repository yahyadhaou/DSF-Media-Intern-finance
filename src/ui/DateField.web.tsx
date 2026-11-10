import { createElement } from 'react';
import { Text, View } from 'react-native';
import type { IsoDate } from '../domain/types';
import { colors, font, radius, TOUCH } from './theme';

/** Browser version (development): the browser's own date input. */
export function DateField({ label, value, onChange }: { label: string; value: IsoDate; onChange: (value: IsoDate) => void }) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={font.label}>{label}</Text>
      {createElement('input', {
        type: 'date',
        value,
        'aria-label': label,
        onChange: (event: { target: { value: string } }) => event.target.value && onChange(event.target.value),
        style: {
          minHeight: TOUCH,
          border: `1px solid ${colors.borderStrong}`,
          borderRadius: radius.md,
          padding: '0 12px',
          fontSize: 16,
          color: colors.text,
          backgroundColor: colors.surface,
          fontFamily: 'inherit',
        },
      })}
    </View>
  );
}
