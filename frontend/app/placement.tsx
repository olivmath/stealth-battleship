import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import GradientContainer from '../src/components/UI/GradientContainer';
import NavalButton from '../src/components/UI/NavalButton';
import Cell from '../src/components/Board/Cell';
import { getLabelSize, computeCellSize } from '../src/components/Board/GameBoard';
import ShipSelector from '../src/components/Ship/ShipSelector';
import ShipPreview from '../src/components/Ship/ShipPreview';
import { useGame } from '../src/context/GameContext';
import { useHaptics } from '../src/hooks/useHaptics';
import { useSettings } from '../src/hooks/useStorage';
import { getShipDefinitions, getShipStyle, getColumnLabels, getRowLabels } from '../src/constants/game';
import { ShipDefinition, Orientation, Position, GridSizeOption } from '../src/types/game';
import { calculatePositions, validatePlacement } from '../src/engine/shipPlacement';
import { autoPlaceShips } from '../src/engine/shipPlacement';
import { createEmptyBoard } from '../src/engine/board';
import { COLORS, FONTS } from '../src/constants/theme';

const SCREEN_PADDING = 16;
const screenWidth = Dimensions.get('window').width;
const CONTENT_WIDTH = Math.min(screenWidth - SCREEN_PADDING * 2, 400);
const VARIANT = 'full' as const;
const LABEL_SIZE = getLabelSize(VARIANT);

export default function PlacementScreen() {
  const router = useRouter();
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { settings } = useSettings();

  const gridSize = state.settings.gridSize;
  const shipDefs = getShipDefinitions(gridSize);
  const CELL_SIZE = computeCellSize(CONTENT_WIDTH, VARIANT, gridSize);

  const colLabels = getColumnLabels(gridSize as GridSizeOption);
  const rowLabels = getRowLabels(gridSize as GridSizeOption);

  const [selectedShip, setSelectedShip] = useState<ShipDefinition | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [previewPositions, setPreviewPositions] = useState<Position[]>([]);
  const [previewValid, setPreviewValid] = useState(false);

  const gridLayoutRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (settings.gridSize !== state.settings.gridSize) {
      dispatch({ type: 'LOAD_SETTINGS', settings });
      dispatch({ type: 'RESET_GAME' });
    }
  }, [settings.gridSize]);

  const placedShipIds = state.playerShips.map(s => s.id);
  const allPlaced = placedShipIds.length === shipDefs.length;

  const handleShipSelect = useCallback((ship: ShipDefinition) => {
    if (selectedShip?.id === ship.id) {
      haptics.light();
      setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
      setPreviewPositions([]);
      setPreviewValid(false);
    } else {
      haptics.light();
      setSelectedShip(ship);
      setPreviewPositions([]);
      setPreviewValid(false);
    }
  }, [selectedShip, haptics]);

  const positionFromTouch = useCallback((pageX: number, pageY: number): Position | null => {
    const localX = pageX - gridLayoutRef.current.x;
    const localY = pageY - gridLayoutRef.current.y - LABEL_SIZE;
    const col = Math.floor(localX / CELL_SIZE);
    const row = Math.floor(localY / CELL_SIZE);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    return null;
  }, [CELL_SIZE, gridSize]);

  const updatePreview = useCallback((pos: Position | null) => {
    if (!pos || !selectedShip) {
      setPreviewPositions([]);
      setPreviewValid(false);
      return;
    }
    const positions = calculatePositions(pos, selectedShip.size, orientation);
    const valid = validatePlacement(state.playerBoard, positions, gridSize);
    setPreviewPositions(positions);
    setPreviewValid(valid);
  }, [selectedShip, orientation, state.playerBoard, gridSize]);

  const handleGridTouchStart = useCallback((e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const pos = positionFromTouch(pageX, pageY);

    if (!selectedShip && pos) {
      const cell = state.playerBoard[pos.row][pos.col];
      if (cell.shipId) {
        haptics.medium();
        dispatch({ type: 'REMOVE_SHIP', shipId: cell.shipId });
        return;
      }
    }

    if (selectedShip && pos) {
      haptics.light();
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

  const handleAutoPlace = () => {
    haptics.medium();
    state.playerShips.forEach(s => {
      dispatch({ type: 'REMOVE_SHIP', shipId: s.id });
    });

    const result = autoPlaceShips(createEmptyBoard(gridSize), shipDefs, gridSize);
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
    const aiResult = autoPlaceShips(createEmptyBoard(gridSize), shipDefs, gridSize);
    if (aiResult) {
      dispatch({
        type: 'START_GAME',
        opponentShips: aiResult.ships,
        opponentBoard: aiResult.board,
      });
      router.replace('/battle');
    }
  };

  const handleAbandon = () => {
    Alert.alert(
      'Abandon Mission',
      'Are you sure you want to abandon ship placement and return to menu?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => router.replace('/menu'),
        },
      ]
    );
  };

  const previewSet = new Set(previewPositions.map(p => `${p.row},${p.col}`));

  return (
    <GradientContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DEPLOY FLEET</Text>
          <Text style={styles.subtitle}>
            {selectedShip
              ? `Tap grid to position \u2022 Tap ${selectedShip.name} again to rotate`
              : allPlaced
                ? 'All ships deployed! Tap a ship to reposition.'
                : 'Select a ship below, then drag on the grid'}
          </Text>
        </View>

        <View style={{ height: 8 }} />

        {/* Grid section with integrated labels */}
        <View
          style={styles.gridSection}
          onLayout={(e) => {
            e.target.measureInWindow((x: number, y: number) => {
              gridLayoutRef.current = { x, y };
            });
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleGridTouchStart}
          onResponderMove={handleGridTouchMove}
          onResponderRelease={handleGridTouchEnd}
        >
          {/* Header row: column labels + empty corner */}
          <View style={styles.labelRow}>
            {colLabels.map(label => (
              <Text
                key={label}
                style={[styles.label, { width: CELL_SIZE, height: LABEL_SIZE, lineHeight: LABEL_SIZE }]}
              >
                {label}
              </Text>
            ))}
            <View style={{ width: LABEL_SIZE, height: LABEL_SIZE }} />
          </View>

          {/* Grid body with row labels on right */}
          <View style={styles.gridBody}>
            {state.playerBoard.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => {
                  const key = `${rowIndex},${colIndex}`;
                  const isPreview = previewSet.has(key);
                  const isInvalidPreview = isPreview && !previewValid;
                  const shipColor = cell.shipId ? getShipStyle(cell.shipId).color : undefined;

                  return (
                    <Cell
                      key={`${rowIndex}-${colIndex}`}
                      state={cell.state}
                      size={CELL_SIZE}
                      isPreview={isPreview}
                      isInvalid={isInvalidPreview}
                      shipColor={shipColor}
                      disabled
                    />
                  );
                })}
                <Text
                  style={[styles.label, { width: LABEL_SIZE, height: CELL_SIZE, lineHeight: CELL_SIZE }]}
                >
                  {rowLabels[rowIndex]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* Ship selector */}
        <View style={styles.selectorSection}>
          <View style={styles.selectorLeft}>
            <ShipSelector
              ships={shipDefs}
              placedShipIds={placedShipIds}
              selectedShipId={selectedShip?.id ?? null}
              onSelect={handleShipSelect}
            />
          </View>
          <View style={styles.selectorRight}>
            {selectedShip && (
              <ShipPreview
                shipSize={selectedShip.size}
                orientation={orientation}
                onToggle={() => {
                  haptics.light();
                  setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
                }}
              />
            )}
          </View>
        </View>

        {/* Flex spacer */}
        <View style={styles.flexSpacer} />

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <NavalButton
            title="BACK"
            onPress={handleAbandon}
            variant="danger"
            size="small"
            style={styles.actionButton}
          />
          <NavalButton
            title="AUTO"
            onPress={handleAutoPlace}
            variant="secondary"
            size="small"
            style={styles.actionButton}
          />
          <NavalButton
            title="READY"
            onPress={handleReady}
            disabled={!allPlaced}
            variant="success"
            size="small"
            style={styles.actionButton}
          />
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SCREEN_PADDING,
  },
  header: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.text.accent,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
    minHeight: 18,
  },
  gridSection: {
    alignSelf: 'center',
    maxWidth: CONTENT_WIDTH,
  },
  labelRow: {
    flexDirection: 'row',
  },
  gridBody: {
    borderWidth: 1,
    borderColor: COLORS.grid.border,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  selectorSection: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorLeft: {
    flex: 1,
  },
  selectorRight: {
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexSpacer: {
    flex: 1,
    minHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
