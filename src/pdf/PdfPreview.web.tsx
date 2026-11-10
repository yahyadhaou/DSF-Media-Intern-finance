import { createElement, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PAGE_HEIGHT, PAGE_WIDTH } from './shell';

/** Browser version (development): the HTML in an iframe, scaled to the available width. */
export function PdfPreview({ html }: { html: string }) {
  const [width, setWidth] = useState(0);
  const pageCount = Math.max(1, (html.match(/class="page"/g) ?? []).length);
  const naturalHeight = pageCount * PAGE_HEIGHT + (pageCount - 1) * 14;
  const scale = width > 0 ? Math.min(1.4, width / PAGE_WIDTH) : 1;

  return (
    <View style={styles.fill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        <View style={{ width: PAGE_WIDTH * scale, height: naturalHeight * scale }}>
          {createElement('iframe', {
            title: 'PDF-Vorschau',
            srcDoc: html,
            style: { width: PAGE_WIDTH, height: naturalHeight, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' },
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#E6ECF2' },
});
