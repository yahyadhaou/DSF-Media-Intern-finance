import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Brand colours of DSF Media (same as the PDF and the web app). */
export const colors = {
  navy: '#0B1F33',
  navySoft: '#17324D',
  teal: '#17C9C4',
  tealDark: '#0E8F8B',
  tealTint: '#E4F8F7',
  magenta: '#D6247A',
  magentaTint: '#FCE8F1',

  bg: '#F3F6F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F9FB',
  border: '#E3E9EF',
  borderStrong: '#CBD5E1',

  text: '#0B1220',
  textSoft: '#334155',
  textMuted: '#64748B',
  placeholder: '#94A3B8',

  success: '#15803D',
  successTint: '#E6F6EC',
  warning: '#B45309',
  warningTint: '#FEF3C7',
  danger: '#C62828',
  dangerTint: '#FDECEC',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Minimum touch target (Apple HIG / Material: 44-48 dp). */
export const TOUCH = 48;

export const font = {
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4, color: colors.navy } satisfies TextStyle,
  h2: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2, color: colors.navy } satisfies TextStyle,
  h3: { fontSize: 16, fontWeight: '700', color: colors.navy } satisfies TextStyle,
  body: { fontSize: 16, color: colors.text } satisfies TextStyle,
  small: { fontSize: 13, color: colors.textMuted } satisfies TextStyle,
  label: { fontSize: 13, fontWeight: '700', color: colors.textSoft } satisfies TextStyle,
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.tealDark } satisfies TextStyle,
};

export const shadow: ViewStyle = Platform.select<ViewStyle>({
  ios: { shadowColor: '#0B1F33', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 2 },
  default: { boxShadow: '0 4px 14px rgba(11,31,51,0.08)' } as ViewStyle,
})!;
