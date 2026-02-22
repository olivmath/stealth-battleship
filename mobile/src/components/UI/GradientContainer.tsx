import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GRADIENT } from '../../shared/theme';

interface Props {
  children: ReactNode;
}

export default function GradientContainer({ children }: Props) {
  return (
    <LinearGradient colors={[...GRADIENT.background]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
