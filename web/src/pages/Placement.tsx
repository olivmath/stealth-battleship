import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { confirm } from '../hooks/useConfirm';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { Cell } from '../components/Board/Cell';
import { getLabelSize, computeCellSize } from '../components/Board/GameBoard';
import { ShipSelector } from '../components/Ship/ShipSelector';
import { ShipPreview } from '../components/Ship/ShipPreview';
import { OpponentStatus } from '../components/PvP/OpponentStatus';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { NavalText } from '../components/UI/NavalText';
import { Spacer } from '../components/UI/Spacer';
import { useGame } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { useSettings } from '../settings/translator';
import { useResponsive } from '../hooks/useResponsive';
import { useWebKeyboard } from '../hooks/useWebKeyboard';
import { getShipDefinitionsForRank, getShipStyle, getColumnLabels, getRowLabels } from '../shared/constants';
import { getLevelInfo } from '../stats/interactor';
import { ShipDefinition, Orientation, Position, GridSizeOption } from '../shared/entities';
import { calculatePositions, validatePlacement, autoPlaceShips, createEmptyBoard, computeBoardCommitment } from '../game/engine';
import { boardValidity, toShipTuples } from '../zk';
import type { ShipTuples } from '../zk';
import { MOCK_OPPONENT, OPPONENT_READY_DELAY_MIN, OPPONENT_READY_DELAY_MAX } from '../services/pvpMock';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, LAYOUT } from '../shared/theme';

const SCREEN_PADDING = LAYOUT.screenPadding;
const VARIANT = 'full' as const;
const LABEL_SIZE = getLabelSize(VARIANT);

export default function Placement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const isPvP = mode === 'pvp';
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { width: screenWidth, isMobile } = useResponsive();
  const maxContent = isMobile ? LAYOUT.maxContentWidth : LAYOUT.maxContentWidthTablet;
  const CONTENT_WIDTH = Math.min(screenWidth - SCREEN_PADDING * 2, maxContent);

  const gridSize = state.settings.gridSize;
  const level = getLevelInfo(state.stats.totalXP);
  const shipDefs = getShipDefinitionsForRank(level.rank);
  const CELL_SIZE = computeCellSize(CONTENT_WIDTH, VARIANT, gridSize);

  const colLabels = getColumnLabels(gridSize as GridSizeOption);
  const rowLabels = getRowLabels(gridSize as GridSizeOption);

  const [selectedShip, setSelectedShip] = useState<ShipDefinition | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [previewPositions, setPreviewPositions] = useState<Position[]>([]);
  const [previewValid, setPreviewValid] = useState(false);

  // PvP ready state
  const [playerReady, setPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [proofStep, setProofStep] = useState('');
  const proofCancelledRef = useRef(false);
  const isLocked = (isPvP && playerReady) || generatingProof;

  const gridRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Arcade: sync settings
  useEffect(() => {
    if (isPvP) return;
    if (settings.gridSize !== state.settings.gridSize) {
      dispatch({ type: 'LOAD_SETTINGS', settings });
      dispatch({ type: 'RESET_GAME' });
    }
  }, [settings.gridSize, isPvP]);

  // PvP: navigate when both ready
  useEffect(() => {
    if (!isPvP) return;
    if (playerReady && opponentReady) {
      haptics.medium();
      const t = setTimeout(() => {
        navigate('/battle?mode=pvp', { replace: true });
      }, 500);
      timersRef.current.push(t);
    }
  }, [playerReady, opponentReady, isPvP]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const placedShipIds = state.playerShips.map(s => s.id);
  const allPlaced = placedShipIds.length === shipDefs.length;

  const handleShipSelect = useCallback((ship: ShipDefinition) => {
    if (isLocked) return;
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
  }, [selectedShip, haptics, isLocked]);

  const positionFromPointer = useCallback((clientX: number, clientY: number): Position | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top - LABEL_SIZE;
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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = positionFromPointer(e.clientX, e.clientY);

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
  }, [selectedShip, state.playerBoard, positionFromPointer, updatePreview, haptics, dispatch, isLocked]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!selectedShip || isLocked) return;
    const pos = positionFromPointer(e.clientX, e.clientY);
    updatePreview(pos);
  }, [selectedShip, positionFromPointer, updatePreview, isLocked]);

  const handlePointerUp = useCallback(() => {
    if (!selectedShip || previewPositions.length === 0 || isLocked) return;

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
  }, [selectedShip, previewPositions, previewValid, orientation, dispatch, haptics, isLocked]);

  const handleAutoPlace = () => {
    if (isLocked) return;
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

  const handleCancelProof = () => {
    console.log('[ZK] Proof generation cancelled by user');
    proofCancelledRef.current = true;
    setGeneratingProof(false);
    setProofStep('');
  };

  const handleReady = async () => {
    haptics.heavy();
    setGeneratingProof(true);
    proofCancelledRef.current = false;

    const aiResult = autoPlaceShips(createEmptyBoard(gridSize), shipDefs, gridSize);
    if (!aiResult) {
      setGeneratingProof(false);
      return;
    }

    const commitment = await computeBoardCommitment(state.playerBoard, state.playerShips);

    // --- ZK: Generate board_validity proofs for player and AI ---
    console.log('[ZK] === BOARD VALIDITY PROOF START ===');
    console.log('[ZK] Grid size:', gridSize);
    console.log('[ZK] Player ships count:', state.playerShips.length);
    console.log('[ZK] AI ships count:', aiResult.ships.length);
    const zkStartTime = performance.now();

    const playerShipTuples = toShipTuples(state.playerShips);
    const aiShipTuples = toShipTuples(aiResult.ships);
    const playerNonce = String(Math.floor(Math.random() * 1000000));
    const aiNonce = String(Math.floor(Math.random() * 1000000));

    console.log('[ZK] Player ships:', playerShipTuples);
    console.log('[ZK] Player nonce:', playerNonce);
    console.log('[ZK] AI ships:', aiShipTuples);
    console.log('[ZK] AI nonce:', aiNonce);

    let playerZk: typeof commitment.playerZk;
    let opponentZk: typeof commitment.opponentZk;

    try {
      setProofStep('Player board proof (1/2)...');
      console.log('[ZK] Starting player board_validity proof...');
      const playerProofStart = performance.now();
      const playerResult = await boardValidity({ ships: playerShipTuples, nonce: playerNonce }, (step) => {
        console.log(`[ZK] Player step: ${step}`);
        setProofStep(`Player: ${step}`);
      });
      if (proofCancelledRef.current) return;

      playerZk = { boardHash: playerResult.boardHash, nonce: playerNonce, proof: playerResult.proof };
      console.log(`[ZK] Player proof OK in ${((performance.now() - playerProofStart) / 1000).toFixed(1)}s - hash: ${playerResult.boardHash}, proof size: ${playerResult.proof.length} bytes`);

      setProofStep('AI board proof (2/2)...');
      console.log('[ZK] Starting AI board_validity proof...');
      const aiProofStart = performance.now();
      const aiResultZk = await boardValidity({ ships: aiShipTuples, nonce: aiNonce }, (step) => {
        console.log(`[ZK] AI step: ${step}`);
        setProofStep(`AI: ${step}`);
      });
      if (proofCancelledRef.current) return;

      opponentZk = { boardHash: aiResultZk.boardHash, nonce: aiNonce, proof: aiResultZk.proof };
      console.log(`[ZK] AI proof OK in ${((performance.now() - aiProofStart) / 1000).toFixed(1)}s - hash: ${aiResultZk.boardHash}, proof size: ${aiResultZk.proof.length} bytes`);

      const totalTime = ((performance.now() - zkStartTime) / 1000).toFixed(1);
      console.log(`[ZK] === BOTH PROOFS GENERATED in ${totalTime}s ===`);
    } catch (err: any) {
      if (proofCancelledRef.current) return;
      const failTime = ((performance.now() - zkStartTime) / 1000).toFixed(1);
      console.error(`[ZK] === PROOF FAILED after ${failTime}s ===`);
      console.error('[ZK] Error:', err.message);
      console.error('[ZK] Stack:', err.stack);
    }
    console.log('[ZK] === BOARD VALIDITY PROOF END ===');

    if (proofCancelledRef.current) return;

    setGeneratingProof(false);
    setProofStep('');

    dispatch({
      type: 'START_GAME',
      opponentShips: aiResult.ships,
      opponentBoard: aiResult.board,
      commitment: { ...commitment, playerZk, opponentZk },
    });

    if (isPvP) {
      setPlayerReady(true);
      const delay = OPPONENT_READY_DELAY_MIN + Math.random() * (OPPONENT_READY_DELAY_MAX - OPPONENT_READY_DELAY_MIN);
      const t = setTimeout(() => setOpponentReady(true), delay);
      timersRef.current.push(t);
    } else {
      navigate('/battle', { replace: true });
    }
  };

  const handleBack = () => {
    confirm({
      title: isPvP ? t('placement.leaveTitle') : t('placement.abandonTitle'),
      message: isPvP ? t('placement.leaveMsg') : t('placement.abandonMsg'),
      cancelText: t('placement.cancel'),
      confirmText: isPvP ? t('placement.leave') : t('placement.abandon'),
      onConfirm: () => {
        timersRef.current.forEach(clearTimeout);
        navigate('/menu', { replace: true });
      },
    });
  };

  // Keyboard shortcut: R to rotate ship
  useWebKeyboard((key) => {
    if (isLocked) return;
    if ((key === 'r' || key === 'R') && selectedShip) {
      haptics.light();
      setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
      setPreviewPositions([]);
      setPreviewValid(false);
    }
  }, [selectedShip, isLocked]);

  const previewSet = new Set(previewPositions.map(p => `${p.row},${p.col}`));

  const subtitleText = isLocked
    ? (opponentReady ? t('placement.bothReady') : t('placement.waitingOpponent'))
    : selectedShip
      ? t('placement.hint', { shipName: t('ships.' + selectedShip.name) })
      : allPlaced
        ? isPvP ? t('placement.allDeployedPvp') : t('placement.allDeployed')
        : t('placement.selectShip');

  return (
    <GradientContainer>
      <div style={styles.container}>
        {/* PvP: Opponent status */}
        {isPvP && (
          <OpponentStatus
            name={MOCK_OPPONENT}
            status={playerReady ? (opponentReady ? 'ready' : 'online') : 'online'}
          />
        )}

        {/* Header */}
        <div style={{ ...styles.header, ...(isPvP ? styles.headerPvP : {}) }}>
          <NavalText variant="h3">{t('placement.title')}</NavalText>
          <NavalText variant="bodyLight" style={{ fontSize: 11, textAlign: 'center', minHeight: 18 }}>{subtitleText}</NavalText>
          {isLocked && !opponentReady && (
            <div style={styles.waitingRow}>
              <RadarSpinner size={20} />
            </div>
          )}
        </div>

        {/* Grid + Selector */}
        <div style={!isMobile ? styles.desktopGridRow : undefined}>
          {/* Grid */}
          <div
            ref={gridRef}
            style={{ ...styles.gridSection, ...(isLocked ? { pointerEvents: 'none' as const } : {}), touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Column labels */}
            <div style={styles.labelRow}>
              {colLabels.map(label => (
                <span
                  key={label}
                  style={{ ...styles.label, width: CELL_SIZE, height: LABEL_SIZE, lineHeight: `${LABEL_SIZE}px` }}
                >
                  {label}
                </span>
              ))}
              <span style={{ width: LABEL_SIZE, height: LABEL_SIZE, display: 'inline-block' }} />
            </div>

            {/* Grid body */}
            <div style={styles.gridBody}>
              {state.playerBoard.map((row, rowIndex) => (
                <div key={rowIndex} style={styles.row}>
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
                  <span
                    style={{ ...styles.label, width: LABEL_SIZE, height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}
                  >
                    {rowLabels[rowIndex]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ship selector */}
          {!isLocked && (
            <div style={{ ...styles.selectorSection, ...(!isMobile ? styles.selectorSectionDesktop : {}) }}>
              <div style={styles.selectorLeft}>
                <ShipSelector
                  ships={shipDefs}
                  placedShipIds={placedShipIds}
                  selectedShipId={selectedShip?.id ?? null}
                  onSelect={handleShipSelect}
                />
              </div>
              <div style={styles.selectorRight}>
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
              </div>
            </div>
          )}
        </div>

        <div style={styles.flexSpacer} />

        {/* Action buttons */}
        <div style={styles.actionsRow}>
          <NavalButton
            title={t('placement.back')}
            onPress={handleBack}
            variant="danger"
            size="small"
            style={styles.actionButton}
          />
          {!isLocked && (
            <>
              <NavalButton
                title={t('placement.auto')}
                onPress={handleAutoPlace}
                variant="pvp"
                size="small"
                style={styles.actionButton}
              />
              <NavalButton
                title={t('placement.ready')}
                onPress={handleReady}
                disabled={!allPlaced}
                variant="success"
                size="small"
                style={styles.actionButton}
              />
            </>
          )}
        </div>

        {/* ZK Proof loading overlay */}
        {generatingProof && (
          <div style={styles.proofOverlay}>
            <div style={styles.proofCard}>
              <RadarSpinner size={48} />
              <span style={styles.proofTitle}>{t('placement.generatingProof', 'Generating ZK Proof')}</span>
              {proofStep ? (
                <span style={styles.proofStepText}>{proofStep}</span>
              ) : (
                <span style={styles.proofSubtitle}>{t('placement.generatingProofHint', 'Preparing...')}</span>
              )}
              <NavalButton
                title={t('placement.cancelProof', 'Cancel')}
                onPress={handleCancelProof}
                variant="danger"
                size="small"
                style={styles.cancelButton}
              />
            </div>
          </div>
        )}
      </div>
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: SCREEN_PADDING,
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    width: '100%',
    maxWidth: LAYOUT.maxContentWidthDesktop,
    boxSizing: 'border-box' as const,
    alignItems: 'center',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  headerPvP: {
    marginTop: SPACING.sm,
  },
  waitingRow: {
    marginTop: SPACING.xs,
    display: 'flex',
    alignItems: 'center',
  },
  gridSection: {
    alignSelf: 'center',
  },
  labelRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  gridBody: {
    border: `1px solid ${COLORS.grid.border}`,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
    display: 'inline-block',
  },
  desktopGridRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
    justifyContent: 'center',
  },
  selectorSection: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  selectorSectionDesktop: {
    flexDirection: 'column',
    width: 200,
    marginTop: SPACING.lg,
  },
  selectorLeft: {
    flex: 1,
  },
  selectorRight: {
    width: 72,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexSpacer: {
    flex: 1,
    minHeight: 4,
  },
  actionsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
    paddingTop: 4,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  proofOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  proofCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 32,
    borderRadius: RADIUS.lg,
    border: `1px solid ${COLORS.grid.border}`,
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    ...SHADOWS.lg,
  },
  proofTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.text.accent,
    letterSpacing: 2,
  },
  proofSubtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  proofStepText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.text.primary,
  },
  cancelButton: {
    marginTop: 8,
    minWidth: 120,
  },
};
