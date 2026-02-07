import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

// 8 frames at 45° intervals — battleship rotating 360°
const RAW_FRAMES = [
  [ // 0° — broadside starboard
    '        ▄██▄',
    '  ▄▄▄▄▄▄████▄▄▄▄▄▄',
    ' ██████████████████▶',
    '  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀',
  ],
  [ // 45° — bow quarter starboard
    '        ▄██▄',
    '     ▄▄████▄▄▄',
    '    ████████████▶',
    '     ▀▀▀▀▀▀▀▀▀▀',
  ],
  [ // 90° — bow
    '        ▄██▄',
    '       ▐████▌',
    '       ▐████▌',
    '        ▀██▀',
  ],
  [ // 135° — bow quarter port
    '        ▄██▄',
    '      ▄▄▄████▄▄',
    '    ◀████████████',
    '      ▀▀▀▀▀▀▀▀▀▀',
  ],
  [ // 180° — broadside port
    '        ▄██▄',
    '  ▄▄▄▄▄▄████▄▄▄▄▄▄',
    ' ◀██████████████████',
    '  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀',
  ],
  [ // 225° — stern quarter port
    '        ▄██▄',
    '     ▄▄████▄▄▄',
    '    ◀██████████',
    '     ▀▀▀▀▀▀▀▀',
  ],
  [ // 270° — stern
    '        ▄██▄',
    '       ▐████▌',
    '       ▐████▌',
    '        ▀▀▀▀',
  ],
  [ // 315° — stern quarter starboard
    '        ▄██▄',
    '      ▄▄▄████▄▄',
    '      ██████████▶',
    '       ▀▀▀▀▀▀▀▀',
  ],
];

// Pad all lines to the widest line so the block doesn't shift between frames
const MAX_LEN = Math.max(...RAW_FRAMES.flat().map(l => l.length));
const FRAMES = RAW_FRAMES.map(lines =>
  lines.map(l => l.padEnd(MAX_LEN)).join('\n')
);

export default function RotatingShip() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES.length);
    }, 350);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.ship}>{FRAMES[frame]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  ship: {
    fontFamily: MONO,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.accent.gold,
  },
});
