import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, useGLTF, Center } from '@react-three/drei/native';
import { Asset } from 'expo-asset';
import RadarSpinner from './RadarSpinner';
import { COLORS, FONTS } from '../../constants/theme';

// Silence EXGL pixelStorei spam (known expo-gl limitation, harmless)
const _origLog = console.log;
console.log = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('EXGL: gl.pixelStorei')) return;
  _origLog(...args);
};

interface Props {
  height?: number;
  style?: ViewStyle;
}

const t0 = performance.now();

function NagatoModel({ uri }: { uri: string }) {
  const { scene } = useGLTF(uri);
  console.log(`[ShipModel] GLB parsed: ${(performance.now() - t0).toFixed(0)}ms`);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    console.log(`[ShipModel] rendered: ${(performance.now() - t0).toFixed(0)}ms`);
  }, []);

  return (
    <group position={[0, 0, 0]}>
      <Center scale={0.05}>
        <primitive object={clone} />
      </Center>
    </group>
  );
}

export default function ShipModel({ height = 200, style }: Props) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    console.log(`[ShipModel] start: 0ms`);
    const asset = Asset.fromModule(require('../../../assets/nagato-nodraco.glb'));
    asset.downloadAsync().then(() => {
      console.log(`[ShipModel] asset ready: ${(performance.now() - t0).toFixed(0)}ms`);
      setUri(asset.localUri || asset.uri);
    });
  }, []);

  if (!uri) {
    return (
      <View style={[styles.container, { height }, style, styles.loader]}>
        <RadarSpinner size={40} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }, style]}>
      <Canvas
        camera={{ position: [3, 2, 6], fov: 45 }}
        style={styles.canvas}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 8, 5]} intensity={3} />
        <directionalLight position={[-3, 4, -2]} intensity={1.5} />
        <pointLight position={[-4, 2, 3]} intensity={2} color="#00e5ff" />
        <Suspense fallback={null}>
          <NagatoModel uri={uri} />
        </Suspense>
        <OrbitControls
          autoRotate
          autoRotateSpeed={3}
          enableZoom={true}
          minDistance={2}
          maxDistance={15}
          enablePan={false}
        />
      </Canvas>
      <Text style={styles.hint}>touch & drag to rotate</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.text.secondary,
    opacity: 0.6,
    letterSpacing: 1,
  },
});
