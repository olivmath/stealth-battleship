import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import GameBoard from '../src/components/Board/GameBoard';
import ShipSelector from '../src/components/Ship/ShipSelector';
import ShipPreview from '../src/components/Ship/ShipPreview';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { SHIP_DEFINITIONS } from '../src/constants/game';
import { ShipDefinition, Orientation, Position } from '../src/types/game';
import { calculatePositions, validatePlacement } from '../src/engine/shipPlacement';
import { autoPlaceShips } from '../src/engine/shipPlacement';
import { createEmptyBoard } from '../src/engine/board';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

export default function PlacementScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();

  const [selectedShip, setSelectedShip] = useState<ShipDefinition | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [previewPositions, setPreviewPositions] = useState<Position[]>([]);

  const placedShipIds = state.playerShips.map(s => s.id);
  const allPlaced = placedShipIds.length === SHIP_DEFINITIONS.length;

  const handleCellPress = useCallback((position: Position) => {
    if (!selectedShip) return;

    const positions = calculatePositions(position, selectedShip.size, orientation);
    if (!validatePlacement(state.playerBoard, positions)) {
      haptics.error();
      return;
    }

    haptics.medium();
    dispatch({
      type: 'PLACE_SHIP',
      ship: {
        id: selectedShip.id,
        name: selectedShip.name,
        size: selectedShip.size,
        positions,
        orientation,
        hits: 0,
        isSunk: false,
      },
    });
    setSelectedShip(null);
    setPreviewPositions([]);
  }, [selectedShip, orientation, state.playerBoard, dispatch, haptics]);

  const handleBoardHover = useCallback((position: Position) => {
    if (!selectedShip) {
      setPreviewPositions([]);
      return;
    }
    const positions = calculatePositions(position, selectedShip.size, orientation);
    const valid = validatePlacement(state.playerBoard, positions);
    setPreviewPositions(valid ? positions : []);
  }, [selectedShip, orientation, state.playerBoard]);

  const handleRotate = () => {
    haptics.light();
    setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
    setPreviewPositions([]);
  };

  const handleAutoPlace = () => {
    haptics.medium();
    // Reset board first
    state.playerShips.forEach(s => {
      dispatch({ type: 'REMOVE_SHIP', shipId: s.id });
    });

    const result = autoPlaceShips(createEmptyBoard(), SHIP_DEFINITIONS);
    if (result) {
      result.ships.forEach(ship => {
        dispatch({ type: 'PLACE_SHIP', ship });
      });
    }
    setSelectedShip(null);
    setPreviewPositions([]);
  };

  const handleReady = () => {
    haptics.heavy();
    const aiResult = autoPlaceShips(createEmptyBoard(), SHIP_DEFINITIONS);
    if (aiResult) {
      dispatch({
        type: 'START_GAME',
        opponentShips: aiResult.ships,
        opponentBoard: aiResult.board,
      });
      router.replace('/battle');
    }
  };

  return (
    <GradientContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>DEPLOY FLEET</Text>
        <Text style={styles.subtitle}>Position your ships on the grid</Text>

        <GameBoard
          board={state.playerBoard}
          onCellPress={selectedShip ? handleCellPress : undefined}
          showShips
          previewPositions={previewPositions}
        />

        {selectedShip && (
          <ShipPreview shipName={selectedShip.name} orientation={orientation} />
        )}

        <ShipSelector
          ships={SHIP_DEFINITIONS}
          placedShipIds={placedShipIds}
          selectedShipId={selectedShip?.id ?? null}
          onSelect={setSelectedShip}
        />

        <View style={styles.actions}>
          <View style={styles.row}>
            <NavalButton
              title="ROTATE"
              onPress={handleRotate}
              disabled={!selectedShip}
              style={styles.halfButton}
            />
            <NavalButton
              title="AUTO"
              onPress={handleAutoPlace}
              variant="secondary"
              style={styles.halfButton}
            />
          </View>
          <NavalButton
            title="READY FOR BATTLE"
            onPress={handleReady}
            disabled={!allPlaced}
          />
        </View>
      </ScrollView>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.text.accent,
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfButton: {
    flex: 1,
  },
});
