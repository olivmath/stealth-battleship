import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import RadarSpinner from './RadarSpinner';

interface Props {
  modelId: string;
  height?: number;
  style?: ViewStyle;
}

export default function SketchfabModel({ modelId, height = 200, style }: Props) {
  const [loading, setLoading] = useState(true);

  const uri = `https://sketchfab.com/models/${modelId}/embed?autostart=1&autospin=0.5&ui_controls=0&ui_infos=0&ui_stop=0&ui_watermark=0&transparent=1`;

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
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
