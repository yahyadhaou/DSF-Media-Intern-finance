import { Modal, Pressable, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './Button';
import { colors, font, radius, space } from './theme';

/**
 * Bottom sheet for pickers and small forms. Tap the dark area or the close button to dismiss.
 * `tall` makes it use most of the screen (lists with search).
 */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
  tall,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tall?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Schließen" />
        <View style={[styles.sheet, tall && styles.tall, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <View style={styles.grabber} />
          <View style={styles.titleRow}>
            <Text style={[font.h2, { flex: 1 }]} numberOfLines={1}>
              {title}
            </Text>
            <IconButton icon="close" label="Schließen" color={colors.navy} onPress={onClose} />
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11,31,51,0.45)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.lg,
    maxHeight: '92%',
  },
  tall: { height: '88%' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm },
  body: { flexShrink: 1, flexGrow: 1 },
  footer: { paddingTop: space.md },
});
