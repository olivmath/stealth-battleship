import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import RadarSpinner from './RadarSpinner';
import { getSketchfabViewerHtml } from '../../shared/ships3d';

interface Props {
  modelId: string;
  height?: number;
  style?: ViewStyle;
}

export default function SketchfabModel({ modelId, height = 200, style }: Props) {
  const [loading, setLoading] = useState(true);

  const html = useMemo(() => getSketchfabViewerHtml(modelId), [modelId]);

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        javaScriptEnabled
        scrollEnabled={false}
        overScrollMode="never"
        accessibilityLabel="3D ship model"
      />
      {loading && (
        <View style={styles.loader}>
          <RadarSpinner size={50} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
