import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { confirm } from '../hooks/useConfirm';
import { useResponsive } from '../hooks/useResponsive';
import { GradientContainer } from '../components/UI/GradientContainer';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { Spacer } from '../components/UI/Spacer';
import { GameBoard, getLabelSize, computeCellSize } from '../components/Board/GameBoard';
import { TurnIndicator } from '../components/Battle/TurnIndicator';
import { FleetStatus } from '../components/Battle/FleetStatus';
import { HealthBarDual } from '../components/Battle/HealthBar';
import { SunkShipModal } from '../components/Battle/SunkShipModal';
import { OpponentStatus } from '../components/PvP/OpponentStatus';
import { TurnTimer } from '../components/PvP/TurnTimer';
import { useGame, useGameEffects } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { processAttack, checkWinCondition, OpponentStrategy, LocalAIStrategy, MockPvPStrategy } from '../game/engine';
import { Position, PlacedShip } from '../shared/entities';
import { shotProof, toShipTuples } from '../zk';
import type { ShipTuples } from '../zk';
import { DIFFICULTY_CONFIG } from '../shared/constants';
import {
  MOCK_OPPONENT,
  TURN_TIMER_SECONDS,
} from '../services/pvpMock';
import { COLORS, FONTS, SPACING, RADIUS, LAYOUT } from '../shared/theme';

const SCREEN_PADDING = LAYOUT.screenPadding;

export default function Battle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const isPvP = mode === 'pvp';
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const { endGame } = useGameEffects();
  const { width: screenWidth, isMobile, isDesktop } = useResponsive();
  const maxContent = isDesktop ? LAYOUT.maxContentWidthDesktop : isMobile ? LAYOUT.maxContentWidth : LAYOUT.maxContentWidthTablet;
  const CONTENT_WIDTH = Math.min(screenWidth - SCREEN_PADDING * 2, maxContent);
  const gridSize = state.settings.gridSize;
  const difficulty = 'hard' as const;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const gameoverRoute = isPvP ? '/gameover?mode=pvp' : '/gameover';

  // Opponent strategy
  const strategyRef = useRef<OpponentStrategy>(
    isPvP
      ? new MockPvPStrategy()
      : new LocalAIStrategy(state.opponent, gridSize, difficulty)
  );

  // Compute grid widths
  const FULL_LABEL = getLabelSize('full');
  const mainCellSize = computeCellSize(CONTENT_WIDTH, 'full', gridSize);
  const GRID_TOTAL_WIDTH = mainCellSize * gridSize + FULL_LABEL;
  const MINI_MAX_WIDTH = Math.floor(GRID_TOTAL_WIDTH * 0.75);

  const [lastEnemyAttack, setLastEnemyAttack] = useState<Position | null>(null);
  const [sunkShip, setSunkShip] = useState<PlacedShip | null>(null);
  const [showSunkModal, setShowSunkModal] = useState(false);

  const showSunkAnimation = useCallback((ship: PlacedShip) => {
    setSunkShip(ship);
    setShowSunkModal(true);
    setTimeout(() => setShowSunkModal(false), 2000);
  }, []);

  // ZK shotProof — fire-and-forget, does NOT block turns
  const [provingShot, setProvingShot] = useState(false);
  const proofQueueRef = useRef(0);

  const generateShotProof = useCallback((
    ships: ShipTuples,
    nonce: string,
    boardHash: string,
    row: number,
    col: number,
    isHit: boolean,
    label: string,
  ) => {
    proofQueueRef.current++;
    setProvingShot(true);
    const shotStart = performance.now();
    console.log(`[ZK] shotProof ${label} START - row:${row} col:${col} hit:${isHit}`);
    shotProof({ ships, nonce, boardHash, row, col, isHit }).then((result) => {
      const elapsed = ((performance.now() - shotStart) / 1000).toFixed(1);
      console.log(`[ZK] shotProof ${label} OK in ${elapsed}s - proof: ${result.proof.length} bytes`);
    }).catch((err: any) => {
      const elapsed = ((performance.now() - shotStart) / 1000).toFixed(1);
      console.warn(`[ZK] shotProof ${label} FAILED after ${elapsed}s:`, err.message);
    }).finally(() => {
      proofQueueRef.current--;
      if (proofQueueRef.current === 0) setProvingShot(false);
    });
  }, []);

  // Player attack
  const handlePlayerAttack = useCallback((position: Position) => {
    if (!state.isPlayerTurn || state.phase !== 'battle') return;

    const cell = state.opponentBoard[position.row][position.col];
    if (cell.state !== 'empty' && cell.state !== 'ship') return;

    const { newShips, result, shipId } = processAttack(
      state.opponentBoard,
      state.opponentShips,
      position
    );

    if (result === 'miss') haptics.light();
    else if (result === 'hit') haptics.medium();
    else if (result === 'sunk') {
      haptics.sunk();
      const sunk = newShips.find(s => s.id === shipId);
      if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
    }

    dispatch({ type: 'PLAYER_ATTACK', position, result, shipId });

    // ZK proof in background — does not block turn
    if (state.commitment?.opponentZk) {
      const { nonce, boardHash } = state.commitment.opponentZk;
      try {
        const opponentTuples = toShipTuples(state.opponentShips);
        generateShotProof(opponentTuples, nonce, boardHash, position.row, position.col, result !== 'miss', 'player->opponent');
      } catch (e) {
        // toShipTuples may fail if ships count doesn't match during game end
      }
    }
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, state.commitment, dispatch, haptics, showSunkAnimation, generateShotProof]);

  // Opponent turn
  useEffect(() => {
    if (state.isPlayerTurn || state.phase !== 'battle') return;

    const timer = setTimeout(() => {
      const strategy = strategyRef.current;
      const position = strategy.computeMove(state.playerBoard, state.playerShips, gridSize);
      if (!position) return;

      setLastEnemyAttack(position);
      const { newShips, result, shipId } = processAttack(state.playerBoard, state.playerShips, position);

      if (result === 'miss') haptics.light();
      else if (result === 'hit') haptics.medium();
      else if (result === 'sunk') {
        haptics.sunk();
        const sunk = newShips.find(s => s.id === shipId);
        if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
      }

      strategy.onMoveResult(position, result, shipId, newShips);

      // Dispatch FIRST to update board and switch turn
      dispatch({ type: 'OPPONENT_ATTACK', position, result, shipId, opponentState: strategy.getState() });

      // ZK proof in background — does not block turn
      if (state.commitment?.playerZk) {
        const { nonce, boardHash } = state.commitment.playerZk;
        try {
          const playerTuples = toShipTuples(state.playerShips);
          generateShotProof(playerTuples, nonce, boardHash, position.row, position.col, result !== 'miss', 'opponent->player');
        } catch (e) {
          // toShipTuples may fail
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [state.isPlayerTurn, state.phase]);

  // Win detection: player victory
  useEffect(() => {
    if (state.phase !== 'battle' || state.opponentShips.length === 0) return;
    if (checkWinCondition(state.opponentShips)) {
      const timer = setTimeout(() => {
        endGame({ won: true, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.opponentShips]);

  // Win detection: opponent victory
  useEffect(() => {
    if (state.phase !== 'battle' || state.playerShips.length === 0) return;
    if (checkWinCondition(state.playerShips)) {
      const timer = setTimeout(() => {
        endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.playerShips]);

  // PvP timer expiry
  const handleTimerExpire = useCallback(() => {
    if (!state.isPlayerTurn || state.phase !== 'battle') return;
    const available: Position[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = state.opponentBoard[row][col];
        if (cell.state === 'empty' || cell.state === 'ship') {
          available.push({ row, col });
        }
      }
    }
    if (available.length === 0) return;
    const position = available[Math.floor(Math.random() * available.length)];
    const { result, shipId } = processAttack(state.opponentBoard, state.opponentShips, position);
    haptics.light();
    dispatch({ type: 'PLAYER_ATTACK', position, result, shipId });
  }, [state.isPlayerTurn, state.phase, state.opponentBoard, state.opponentShips, dispatch, haptics]);

  const handleSurrender = () => {
    confirm({
      title: t('battle.surrenderTitle'),
      message: isPvP ? t('battle.surrenderPvpMsg') : t('battle.surrenderMsg'),
      cancelText: t('battle.cancel'),
      confirmText: t('battle.surrenderTitle'),
      onConfirm: () => {
        endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      },
    });
  };

  const turnText = isPvP
    ? state.isPlayerTurn ? t('battle.yourTurn') : `${MOCK_OPPONENT.toUpperCase()}'S TURN`
    : undefined;

  return (
    <GradientContainer>
      <div style={styles.container}>
        {isPvP && <OpponentStatus name={MOCK_OPPONENT} status="online" />}

        {/* Turn status */}
        {isPvP ? (
          <>
            <div style={{ ...styles.turnContainer, ...(!state.isPlayerTurn ? styles.turnContainerEnemy : {}) }}>
              <div style={{ ...styles.turnDot, backgroundColor: state.isPlayerTurn ? COLORS.accent.gold : COLORS.accent.fire }} />
              <span style={{ ...styles.turnText, ...(!state.isPlayerTurn ? styles.turnTextEnemy : {}) }}>
                {turnText}
              </span>
              {provingShot && <RadarSpinner size={14} />}
            </div>
            <TurnTimer
              duration={TURN_TIMER_SECONDS}
              isActive={state.phase === 'battle'}
              isPlayerTurn={state.isPlayerTurn}
              onExpire={handleTimerExpire}
            />
          </>
        ) : (
          <div style={styles.turnRow}>
            <TurnIndicator isPlayerTurn={state.isPlayerTurn} />
            {provingShot && (
              <div style={styles.provingIndicator}>
                <RadarSpinner size={14} />
                <span style={styles.provingText}>{t('battle.proving')}</span>
              </div>
            )}
          </div>
        )}

        {/* Health Bars — dual bar: ENEMY [████←][→████] YOURS */}
        <div style={{ width: '100%', maxWidth: CONTENT_WIDTH }}>
          <HealthBarDual
            playerShips={state.playerShips}
            opponentShips={state.opponentShips}
            playerLabel={t('battle.yourFleet')}
            opponentLabel={t('battle.enemyFleet')}
          />
        </div>

        {/* Grids */}
        {!isMobile ? (
          <div style={styles.sideBySide}>
            <div style={styles.sideBySideGrid}>
              <FleetStatus ships={state.playerShips} label={t('battle.yours')} compact />
              <GameBoard
                board={state.playerBoard}
                showShips
                disabled
                gridSize={gridSize}
                maxWidth={Math.floor(CONTENT_WIDTH * 0.46)}
                variant="full"
                lastAttackPosition={lastEnemyAttack}
              />
            </div>
            <div style={styles.sideBySideGrid}>
              <FleetStatus ships={state.opponentShips} label={t('battle.enemy')} compact />
              <GameBoard
                board={state.opponentBoard}
                onCellPress={state.isPlayerTurn ? handlePlayerAttack : undefined}
                disabled={!state.isPlayerTurn}
                showShips={false}
                gridSize={gridSize}
                isOpponent
                maxWidth={Math.floor(CONTENT_WIDTH * 0.46)}
                variant="full"
              />
            </div>
          </div>
        ) : (
          <div style={{ width: GRID_TOTAL_WIDTH }}>
            <GameBoard
              board={state.opponentBoard}
              onCellPress={state.isPlayerTurn && !provingShot ? handlePlayerAttack : undefined}
              disabled={!state.isPlayerTurn || provingShot}
              showShips={false}
              gridSize={gridSize}
              isOpponent
              maxWidth={GRID_TOTAL_WIDTH}
              variant="full"
            />

            <Spacer size="sm" />

            <div style={styles.bottomPanel}>
              <div style={styles.miniMapColumn}>
                <GameBoard
                  board={state.playerBoard}
                  showShips
                  disabled
                  gridSize={gridSize}
                  maxWidth={MINI_MAX_WIDTH}
                  variant="mini"
                  colLabelsBottom
                  lastAttackPosition={lastEnemyAttack}
                />
              </div>
              <div style={styles.fleetColumn}>
                <FleetStatus ships={state.playerShips} label={t('battle.yours')} compact />
                <FleetStatus ships={state.opponentShips} label={t('battle.enemy')} compact />
              </div>
            </div>
          </div>
        )}

        {/* Surrender */}
        <div style={{ marginTop: 'auto', flexShrink: 0, paddingBottom: SPACING.sm }}>
          <NavalButton
            title={t('battle.surrender')}
            onPress={handleSurrender}
            variant="danger"
            size="small"
          />
        </div>
      </div>
      <SunkShipModal visible={showSunkModal} ship={sunkShip} onDismiss={() => setShowSunkModal(false)} />
    </GradientContainer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: SCREEN_PADDING,
    gap: SPACING.xs,
    height: '100vh',
    overflow: 'hidden',
    width: '100%',
    maxWidth: LAYOUT.maxContentWidthDesktop,
    boxSizing: 'border-box' as const,
    alignItems: 'center',
  },
  turnRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    width: '100%',
  },
  sideBySide: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  sideBySideGrid: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  bottomPanel: {
    display: 'flex',
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  miniMapColumn: {
    display: 'flex',
    alignItems: 'center',
  },
  fleetColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  turnContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: RADIUS.default,
    border: `1px solid ${COLORS.accent.gold}`,
    backgroundColor: COLORS.overlay.goldMedium,
    gap: 8,
  },
  turnContainerEnemy: {
    borderColor: COLORS.accent.fire,
    backgroundColor: COLORS.overlay.fireGlow,
  },
  turnDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.default,
    marginRight: 8,
  },
  turnText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: COLORS.text.accent,
    letterSpacing: 2,
  },
  turnTextEnemy: {
    color: COLORS.accent.fire,
  },
  provingIndicator: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  provingText: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.accent.gold,
    letterSpacing: 2,
  },
};
