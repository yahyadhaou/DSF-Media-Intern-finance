import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../ui/theme';

/**
 * Shows the exact HTML that becomes the PDF, fitted to the screen width (the page's
 * viewport meta is 595 px wide). Pinch to zoom, scroll to see further pages.
 */
export function PdfPreview({ html }: { html: string }) {
  return (
    <View style={styles.fill}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.fill}
        scalesPageToFit
        // Android: ignore the system font size (Samsung "Schriftgröße"), otherwise the preview
        // text grows and table headers like „HIN- & RÜCK (KM)“ wrap differently than in the PDF.
        textZoom={100}
        setBuiltInZoomControls
        setDisplayZoomControls={false}
        bounces
        showsVerticalScrollIndicator
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.tealDark} size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#E6ECF2' },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6ECF2' },
});
