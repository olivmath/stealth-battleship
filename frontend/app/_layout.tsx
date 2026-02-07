import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { Rajdhani_400Regular, Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { GameProvider } from '../src/context/GameContext';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { COLORS } from '../src/constants/theme';
import { MENU_MODEL_ID, getSketchfabViewerHtml } from '../src/constants/ships3d';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <RadarSpinner size={60} />
      </View>
    );
  }

  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background.dark },
          animation: 'fade',
        }}
      />
      {/* Hidden WebView to preload 3D model into cache during splash/login */}
      <View style={styles.preloader} pointerEvents="none">
        <WebView
          source={{ html: getSketchfabViewerHtml(MENU_MODEL_ID) }}
          originWhitelist={['*']}
          javaScriptEnabled
          style={{ width: 1, height: 1 }}
        />
      </View>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.dark,
  },
  preloader: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
});
