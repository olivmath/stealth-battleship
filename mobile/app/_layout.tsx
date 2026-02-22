import '../src/i18n';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { Rajdhani_400Regular, Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import { View, StyleSheet, Platform } from 'react-native';
import { GameProvider } from '../src/game/translator';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { COLORS } from '../src/shared/theme';
import { ZKWebView, initZK, webViewZKProvider, ServerZKProvider, WebWasmZKProvider } from '../src/zk';

const ZK_MODE = process.env.EXPO_PUBLIC_ZK_MODE || 'local';
const ZK_SERVER_URL = process.env.EXPO_PUBLIC_ZK_SERVER_URL || 'http://localhost:3000';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
  });

  useEffect(() => {
    const provider = ZK_MODE === 'server'
      ? new ServerZKProvider(ZK_SERVER_URL)
      : Platform.OS === 'web'
        ? new WebWasmZKProvider()
        : webViewZKProvider;

    console.log(`[ZK] Initializing ZK provider (mode=${ZK_MODE})...`);
    initZK(provider).then(() => {
      console.log('[ZK] Provider ready ✓');
    }).catch((err) => {
      console.error('[ZK] Provider init failed:', err);
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <RadarSpinner size={60} />
      </View>
    );
  }

  return (
    <GameProvider>
      {ZK_MODE === 'local' && Platform.OS !== 'web' && <ZKWebView />}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background.dark },
          animation: 'fade',
        }}
      />
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
});
