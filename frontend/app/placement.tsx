import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import Cell from '../src/components/Board/Cell';
import CoordinateLabels from '../src/components/Board/CoordinateLabels';
import ShipSelector from '../src/components/Ship/ShipSelector';
import ShipPreview from '../src/components/Ship/ShipPreview';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { SHIP_DEFINITIONS, GRID_SIZE } from '../src/constants/game';
import { ShipDefinition, Orientation, Position } from '../src/types/game';
import { calculatePositions, validatePlacement } from '../src/engine/shipPlacement';
import { autoPlaceShips } from '../src/engine/shipPlacement';
import { createEmptyBoard } from '../src/engine/board';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';

const LABEL_WIDTH = 20;
const screenWidth = Dimensions.get('window').width;
const maxGridWidth = screenWidth - SPACING.lg * 2 - LABEL_WIDTH;
const CELL_SIZE = Math.floor(maxGridWidth / GRID_SIZE);

export default function PlacementScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();

  const [selectedShip, setSelectedShip] = useState<ShipDefinition | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [previewPositions, setPreviewPositions] = useState<Position[]>([]);
  const [previewValid, setPreviewValid] = useState(false);

  const gridLayoutRef = useRef({ x: 0, y: 0 });

  const placedShipIds = state.playerShips.map(s => s.id);
  const allPlaced = placedShipIds.length === SHIP_DEFINITIONS.length;

  // --- Ship Selector handlers ---

  const handleShipSelect = useCallback((ship: ShipDefinition) => {
    if (selectedShip?.id === ship.id) {
      // Tap again → rotate
      haptics.light();
      setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
      setPreviewPositions([]);
      setPreviewValid(false);
    } else {
      // Select new ship
      haptics.light();
      setSelectedShip(ship);
      setPreviewPositions([]);
      setPreviewValid(false);
    }
  }, [selectedShip, haptics]);

  // --- Grid touch handlers (drag to position) ---

  const positionFromTouch = useCallback((pageX: number, pageY: number): Position | null => {
    const gridX = pageX - gridLayoutRef.current.x - LABEL_WIDTH;
    const gridY = pageY - gridLayoutRef.current.y;
    const col = Math.floor(gridX / CELL_SIZE);
    const row = Math.floor(gridY / CELL_SIZE);
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return { row, col };
    }
    return null;
  }, []);

  const updatePreview = useCallback((pos: Position | null) => {
    if (!pos || !selectedShip) {
      setPreviewPositions([]);
      setPreviewValid(false);
      return;
    }
    const positions = calculatePositions(pos, selectedShip.size, orientation);
    const valid = validatePlacement(state.playerBoard, positions);
    setPreviewPositions(positions);
    setPreviewValid(valid);
  }, [selectedShip, orientation, state.playerBoard]);

  const handleGridTouchStart = useCallback((e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const pos = positionFromTouch(pageX, pageY);

    if (!selectedShip && pos) {
      // No ship selected — check if tapping a placed ship to remove
      const cell = state.playerBoard[pos.row][pos.col];
      if (cell.shipId) {
        haptics.medium();
        dispatch({ type: 'REMOVE_SHIP', shipId: cell.shipId });
        return;
      }
    }

    updatePreview(pos);
  }, [selectedShip, state.playerBoard, positionFromTouch, updatePreview, haptics, dispatch]);

  const handleGridTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!selectedShip) return;
    const { pageX, pageY } = e.nativeEvent;
    const pos = positionFromTouch(pageX, pageY);
    updatePreview(pos);
  }, [selectedShip, positionFromTouch, updatePreview]);

  const handleGridTouchEnd = useCallback(() => {
    if (!selectedShip || previewPositions.length === 0) return;

    if (previewValid) {
      haptics.medium();
      dispatch({
        type: 'PLACE_SHIP',
        ship: {
          id: selectedShip.id,
          name: selectedShip.name,
          size: selectedShip.size,
          positions: previewPositions,
          orientation,
          hits: 0,
          isSunk: false,
        },
      });
      setSelectedShip(null);
    } else {
      haptics.error();
    }

    setPreviewPositions([]);
    setPreviewValid(false);
  }, [selectedShip, previewPositions, previewValid, orientation, dispatch, haptics]);

  // --- Actions ---

  const handleAutoPlace = () => {
    haptics.medium();
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

  // --- Preview set ---

  const previewSet = new Set(previewPositions.map(p => `${p.row},${p.col}`));

  return (
    <GradientContainer>
      <View style={styles.container}>
        <Text style={styles.title}>DEPLOY FLEET</Text>
        <Text style={styles.subtitle}>
          {selectedShip
            ? `Tap grid to position • Tap ${selectedShip.name} again to rotate`
            : allPlaced
              ? 'All ships deployed! Tap a ship to reposition.'
              : 'Select a ship below, then drag on the grid'}
        </Text>

        {/* Grid with touch tracking */}
        <View
          style={styles.gridWrapper}
          onLayout={(e) => {
            e.target.measureInWindow((x: number, y: number) => {
              gridLayoutRef.current = { x, y };
            });
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderStart={handleGridTouchStart}
          onResponderMove={handleGridTouchMove}
          onResponderRelease={handleGridTouchEnd}
        >
          <CoordinateLabels cellSize={CELL_SIZE} />
          <View style={[styles.grid, { marginLeft: LABEL_WIDTH }]}>
            {state.playerBoard.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => {
                  const key = `${rowIndex},${colIndex}`;
                  const isPreview = previewSet.has(key);
                  const isInvalidPreview = isPreview && !previewValid;

                  return (
                    <Cell
                      key={`${rowIndex}-${colIndex}`}
                      state={cell.state}
                      size={CELL_SIZE}
                      isPreview={isPreview}
                      isInvalid={isInvalidPreview}
                      disabled
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {selectedShip && (
          <ShipPreview shipName={selectedShip.name} orientation={orientation} />
        )}

        <ShipSelector
          ships={SHIP_DEFINITIONS}
          placedShipIds={placedShipIds}
          selectedShipId={selectedShip?.id ?? null}
          onSelect={handleShipSelect}
        />

        <View style={styles.actions}>
          <NavalButton
            title="AUTO PLACE"
            onPress={handleAutoPlace}
            variant="secondary"
          />
          <NavalButton
            title="READY FOR BATTLE"
            onPress={handleReady}
            disabled={!allPlaced}
          />
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
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
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    minHeight: 32,
  },
  gridWrapper: {
    alignSelf: 'center',
  },
  grid: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  row: {
    flexDirection: 'row',
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
