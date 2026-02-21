import '../src/i18n';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { Rajdhani_400Regular, Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import { View, StyleSheet } from 'react-native';
import { GameProvider } from '../src/context/GameContext';
import RadarSpinner from '../src/components/UI/RadarSpinner';
import { COLORS } from '../src/constants/theme';
import { ZKWebView, initZK, webViewZKProvider } from '../src/services/zk';

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

  useEffect(() => {
    console.log('[ZK] Initializing ZK provider...');
    initZK(webViewZKProvider).then(() => {
      console.log('[ZK] Provider ready ✓');
    }).catch((err) => {
      console.error('[ZK] Provider init failed:', err);
    });
  }, []);

  return (
    <GameProvider>
      <ZKWebView />
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
