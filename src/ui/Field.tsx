import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';
import { eurosToCents, numberToInput, parseDecimal } from '../domain/money';
import { colors, font, radius, TOUCH } from './theme';

interface BaseProps {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: string;
  placeholder?: string;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'street-address' | 'postal-code' | 'email' | 'tel' | 'off';
  maxLength?: number;
}

/** Label above, big input, optional hint or error below: the pattern used for every form field. */
function FieldFrame({ label, hint, error, children, style }: BaseProps & { children: React.ReactNode }) {
  return (
    <View style={[styles.frame, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function TextField({
  label,
  hint,
  error,
  suffix,
  placeholder,
  editable = true,
  style,
  value,
  onChangeText,
  keyboardType,
  multiline,
  autoCapitalize = 'sentences',
  autoComplete,
  maxLength,
}: TextFieldProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error} style={style}>
      <View style={[styles.inputWrap, !editable && styles.readonly, error ? styles.inputError : null]}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          maxLength={maxLength}
          autoCorrect={false}
          style={[styles.input, multiline && styles.multiline]}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </FieldFrame>
  );
}

interface DecimalProps extends BaseProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Number input that accepts `12,5` and `12.5`. It keeps its own text while typing,
 * so a half-typed `12,` is not rewritten under the user's finger.
 */
export function NumberField({ value, onChange, ...frame }: DecimalProps) {
  const [text, setText] = useState(numberToInput(value));
  const [seen, setSeen] = useState(value);
  // The value changed from outside (not by typing): show it. Setting state while rendering is the supported way to do this.
  if (value !== seen) {
    setSeen(value);
    if (parseDecimal(text) !== value) setText(numberToInput(value));
  }

  return (
    <TextField
      {...frame}
      value={text}
      keyboardType="decimal-pad"
      autoCapitalize="none"
      onChangeText={(next) => {
        setText(next);
        onChange(parseDecimal(next));
      }}
    />
  );
}

/** Euro amount shown as euros, stored as integer cents. */
export function MoneyField({ value, onChange, ...frame }: Omit<DecimalProps, 'suffix'>) {
  return <NumberField {...frame} suffix="€" value={value / 100} onChange={(euros) => onChange(eurosToCents(euros))} />;
}

const styles = StyleSheet.create({
  frame: { gap: 6 },
  label: font.label,
  hint: font.small,
  error: { ...font.small, color: colors.danger },
  inputWrap: {
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  inputError: { borderColor: colors.danger },
  readonly: { backgroundColor: colors.surfaceMuted },
  input: { flex: 1, minWidth: 0, fontSize: 16, color: colors.text, paddingVertical: 10, outlineStyle: 'none' } as never,
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  suffix: { fontSize: 15, fontWeight: '700', color: colors.textMuted, marginLeft: 8 },
});
