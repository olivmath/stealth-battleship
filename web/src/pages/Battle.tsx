import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { confirm } from '../hooks/useConfirm';
import { useResponsive } from '../hooks/useResponsive';
import { PageShell } from '../components/UI/PageShell';
import { NavalButton } from '../components/UI/NavalButton';
import { RadarSpinner } from '../components/UI/RadarSpinner';
import { GameBoard, getLabelSize, computeCellSize } from '../components/Board/GameBoard';
import { FleetStatus } from '../components/Battle/FleetStatus';
import { HealthBarDual } from '../components/Battle/HealthBar';
import { SunkShipModal } from '../components/Battle/SunkShipModal';
import { OpponentStatus } from '../components/PvP/OpponentStatus';
import { TurnTimer } from '../components/PvP/TurnTimer';
import { useGame, useGameEffects } from '../game/translator';
import { useHaptics } from '../hooks/useHaptics';
import { usePvP } from '../pvp/translator';
import { processAttack, checkWinCondition, LocalAIStrategy } from '../game/engine';
import type { OpponentStrategy } from '../game/engine';
import { Position, PlacedShip } from '../shared/entities';
import { shotProof, toShipTuples } from '../zk';
import type { ShipTuples } from '../zk';
import { DIFFICULTY_CONFIG } from '../shared/constants';
import { ZKProofLog, ZKLogEntry } from '../components/UI/ZKProofLog';
import { COLORS, FONTS, SPACING, RADIUS, LAYOUT } from '../shared/theme';

const SCREEN_PADDING = LAYOUT.screenPadding;
const PVP_TURN_TIMER_SECONDS = 30;

export default function Battle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const isPvP = mode === 'pvp';
  const { state, dispatch } = useGame();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const { endGame } = useGameEffects();
  const pvp = usePvP();
  const { width: screenWidth, isMobile, isDesktop } = useResponsive();
  const maxContent = isDesktop ? LAYOUT.maxContentWidthDesktop : isMobile ? LAYOUT.maxContentWidth : LAYOUT.maxContentWidthTablet;
  const CONTENT_WIDTH = Math.min(screenWidth - SCREEN_PADDING * 2, maxContent);
  const gridSize = state.settings.gridSize;
  const difficulty = 'hard' as const;
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const gameoverRoute = isPvP ? '/gameover?mode=pvp' : '/gameover';

  // AI strategy (arcade mode only)
  const strategyRef = useRef<OpponentStrategy | null>(
    isPvP ? null : new LocalAIStrategy(state.opponent, gridSize, difficulty)
  );

  // Compute grid widths
  const FULL_LABEL = getLabelSize('full');
  const mainCellSize = computeCellSize(CONTENT_WIDTH, 'full', gridSize);
  const GRID_TOTAL_WIDTH = mainCellSize * gridSize + FULL_LABEL;
  const MINI_MAX_WIDTH = Math.floor(GRID_TOTAL_WIDTH * 0.75);

  const [zkLogs, setZkLogs] = useState<ZKLogEntry[]>([]);
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
      setZkLogs(prev => [...prev, {
        id: `${label}-${Date.now()}`,
        circuit: 'shot_proof',
        timeMs: performance.now() - shotStart,
        sizeBytes: result.proof.length,
        status: 'ok',
        timestamp: Date.now(),
        label,
      }]);
      return result;
    }).catch((err: any) => {
      const elapsed = ((performance.now() - shotStart) / 1000).toFixed(1);
      console.warn(`[ZK] shotProof ${label} FAILED after ${elapsed}s:`, err.message);
      setZkLogs(prev => [...prev, {
        id: `${label}-${Date.now()}`,
        circuit: 'shot_proof',
        timeMs: performance.now() - shotStart,
        sizeBytes: 0,
        status: 'fail',
        timestamp: Date.now(),
        label,
      }]);
      return null;
    }).finally(() => {
      proofQueueRef.current--;
      if (proofQueueRef.current === 0) setProvingShot(false);
    });
  }, []);

  // ─── PvP: Use server turn state ───
  const isMyTurn = isPvP ? (pvp.match?.isMyTurn ?? false) : state.isPlayerTurn;

  // ─── Player attack ───
  const handlePlayerAttack = useCallback((position: Position) => {
    if (!isMyTurn || state.phase !== 'battle') return;

    const cell = state.opponentBoard[position.row][position.col];
    if (cell.state !== 'empty' && cell.state !== 'ship') return;

    if (isPvP) {
      // PvP: send attack to server, wait for result_confirmed
      pvp.attack(position.row, position.col);
      // Optimistically mark cell as pending (disable further clicks)
      dispatch({ type: 'PLAYER_ATTACK', position, result: 'miss', shipId: undefined });
    } else {
      // Arcade: process locally
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

      // ZK proof in background
      if (state.commitment?.opponentZk) {
        const { nonce, boardHash } = state.commitment.opponentZk;
        try {
          const opponentTuples = toShipTuples(state.opponentShips);
          generateShotProof(opponentTuples, nonce, boardHash, position.row, position.col, result !== 'miss', 'player->opponent');
        } catch (e) { /* ignore */ }
      }
    }
  }, [isMyTurn, state.phase, state.opponentBoard, state.opponentShips, state.commitment, dispatch, haptics, showSunkAnimation, generateShotProof, isPvP, pvp]);

  // ─── PvP: Handle result_confirmed from server (our attack result) ───
  const lastConfirmedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isPvP || !pvp.lastResultConfirmed) return;
    const rc = pvp.lastResultConfirmed;
    const key = `${rc.row},${rc.col},${rc.turnNumber}`;
    if (key === lastConfirmedRef.current) return;
    lastConfirmedRef.current = key;

    console.debug('[Battle] Result confirmed:', rc);
    // Update the cell with actual result from server
    dispatch({ type: 'PLAYER_ATTACK', position: { row: rc.row, col: rc.col }, result: rc.result, shipId: undefined });

    if (rc.result === 'miss') haptics.light();
    else haptics.medium();

    if (rc.sunkShipName && rc.sunkShipSize) {
      const syntheticShip: PlacedShip = {
        id: `sunk-${rc.turnNumber}`,
        name: rc.sunkShipName,
        size: rc.sunkShipSize,
        positions: [],
        orientation: 'horizontal',
        hits: rc.sunkShipSize,
        isSunk: true,
      };
      setTimeout(() => showSunkAnimation(syntheticShip), 500);
    }
  }, [pvp.lastResultConfirmed, isPvP]);

  // ─── PvP: Handle incoming_attack from opponent ───
  const lastIncomingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isPvP || !pvp.lastIncomingAttack) return;
    const atk = pvp.lastIncomingAttack;
    const key = `${atk.row},${atk.col},${atk.turnNumber}`;
    if (key === lastIncomingRef.current) return;
    lastIncomingRef.current = key;

    console.debug('[Battle] Incoming attack:', atk);
    setLastEnemyAttack({ row: atk.row, col: atk.col });

    // Process attack on our board
    const { newShips, result, shipId } = processAttack(state.playerBoard, state.playerShips, { row: atk.row, col: atk.col });

    if (result === 'miss') haptics.light();
    else if (result === 'hit') haptics.medium();
    else if (result === 'sunk') {
      haptics.sunk();
      const sunk = newShips.find(s => s.id === shipId);
      if (sunk) setTimeout(() => showSunkAnimation(sunk), 1000);
    }

    dispatch({ type: 'OPPONENT_ATTACK', position: { row: atk.row, col: atk.col }, result, shipId, opponentState: undefined });

    // Compute sunk info for the attacker
    const sunkShipName = result === 'sunk' ? newShips.find(s => s.id === shipId)?.name : undefined;
    const sunkShipSize = result === 'sunk' ? newShips.find(s => s.id === shipId)?.size : undefined;

    // Send shot result to server with real ZK proof
    const proofResultLabel = result === 'sunk' ? 'hit' : result;
    const commitment = state.commitment?.playerZk;
    if (commitment) {
      (async () => {
        try {
          const proofResult = await shotProof({
            ships: toShipTuples(state.playerShips),
            nonce: String(commitment.nonce),
            boardHash: commitment.boardHash,
            row: atk.row,
            col: atk.col,
            isHit: result !== 'miss',
          });
          pvp.respondShotResult(atk.row, atk.col, proofResultLabel as 'hit' | 'miss', Array.from(proofResult.proof), sunkShipName, sunkShipSize);
        } catch (err) {
          console.error('shot_proof generation failed:', err);
          pvp.respondShotResult(atk.row, atk.col, proofResultLabel as 'hit' | 'miss', [], sunkShipName, sunkShipSize);
        }
      })();
    } else {
      pvp.respondShotResult(atk.row, atk.col, proofResultLabel as 'hit' | 'miss', [], sunkShipName, sunkShipSize);
    }
  }, [pvp.lastIncomingAttack, isPvP]);

  // ─── PvP: Handle game_over from server ───
  useEffect(() => {
    if (!isPvP || !pvp.gameOver) return;
    const isWinner = pvp.gameOver.winner === pvp.myPublicKeyHex;

    // Send board reveal to server for turns_proof verification
    const commitment = state.commitment?.playerZk;
    if (commitment && pvp.match?.matchId) {
      pvp.sendReveal(pvp.match.matchId, toShipTuples(state.playerShips), String(commitment.nonce));
    }

    const timer = setTimeout(() => {
      endGame({ won: isWinner, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
    }, 1000);
    return () => clearTimeout(timer);
  }, [pvp.gameOver, isPvP]);

  // ─── Arcade: Opponent turn (AI) ───
  useEffect(() => {
    if (isPvP) return; // PvP uses socket events
    if (state.isPlayerTurn || state.phase !== 'battle') return;

    const timer = setTimeout(() => {
      const strategy = strategyRef.current;
      if (!strategy) return;
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
      dispatch({ type: 'OPPONENT_ATTACK', position, result, shipId, opponentState: strategy.getState() });

      // ZK proof in background
      if (state.commitment?.playerZk) {
        const { nonce, boardHash } = state.commitment.playerZk;
        try {
          const playerTuples = toShipTuples(state.playerShips);
          generateShotProof(playerTuples, nonce, boardHash, position.row, position.col, result !== 'miss', 'opponent->player');
        } catch (e) { /* ignore */ }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [state.isPlayerTurn, state.phase, isPvP]);

  // Arcade: Win detection - player victory
  useEffect(() => {
    if (isPvP) return; // PvP win comes from server
    if (state.phase !== 'battle' || state.opponentShips.length === 0) return;
    if (checkWinCondition(state.opponentShips)) {
      const timer = setTimeout(() => {
        endGame({ won: true, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.opponentShips, isPvP]);

  // Arcade: Win detection - opponent victory
  useEffect(() => {
    if (isPvP) return;
    if (state.phase !== 'battle' || state.playerShips.length === 0) return;
    if (checkWinCondition(state.playerShips)) {
      const timer = setTimeout(() => {
        endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.playerShips, isPvP]);

  // PvP timer expiry — auto-random-attack
  const handleTimerExpire = useCallback(() => {
    if (!isMyTurn || state.phase !== 'battle') return;
    if (isPvP) {
      // Send random attack
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
      pvp.attack(position.row, position.col);
    }
  }, [isMyTurn, state.phase, state.opponentBoard, isPvP, pvp, gridSize]);

  const handleSurrender = () => {
    confirm({
      title: t('battle.surrenderTitle'),
      message: isPvP ? t('battle.surrenderPvpMsg') : t('battle.surrenderMsg'),
      cancelText: t('battle.cancel'),
      confirmText: t('battle.surrenderTitle'),
      onConfirm: () => {
        if (isPvP) pvp.forfeit();
        endGame({ won: false, tracking: state.tracking, opponentShips: state.opponentShips, playerShips: state.playerShips, gridSize, difficulty, navigateTo: gameoverRoute, commitment: state.commitment });
      },
    });
  };

  const opponentName = isPvP && pvp.match?.opponentKey
    ? pvp.match.opponentKey.slice(0, 8) + '...'
    : 'AI';

  const turnText = isPvP
    ? isMyTurn ? t('battle.yourTurn') : `${opponentName.toUpperCase()}'S TURN`
    : undefined;

  // Mini board sizing: ~75% of main grid
  const MINI_BOARD_WIDTH = Math.floor(GRID_TOTAL_WIDTH * 0.75);

  return (
    <PageShell hideHeader maxWidth="wide" contentStyle={{ padding: 0, overflow: 'hidden', flex: 1 }}>
      <div style={styles.container}>
        {isPvP && <OpponentStatus name={opponentName} status="online" />}

        {/* PvP turn status + timer */}
        {isPvP && (
          <>
            <div style={{ ...styles.turnContainer, ...(!isMyTurn ? styles.turnContainerEnemy : {}) }} role="status" aria-live="polite">
              <div style={{ ...styles.turnDot, backgroundColor: isMyTurn ? COLORS.accent.gold : COLORS.accent.fire }} />
              <span style={{ ...styles.turnText, ...(!isMyTurn ? styles.turnTextEnemy : {}) }}>
                {turnText}
              </span>
              {provingShot && <RadarSpinner size={14} />}
            </div>
            <TurnTimer
              duration={PVP_TURN_TIMER_SECONDS}
              isActive={state.phase === 'battle'}
              isPlayerTurn={isMyTurn}
              onExpire={handleTimerExpire}
            />
          </>
        )}

        {/* Health Bars — YOU (left→center) | ENEMY (right→center) */}
        <div style={{ width: '100%', maxWidth: CONTENT_WIDTH }}>
          <HealthBarDual
            playerShips={state.playerShips}
            opponentShips={state.opponentShips}
            playerLabel="YOU"
            opponentLabel="ENEMY"
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
                onCellPress={isMyTurn ? handlePlayerAttack : undefined}
                disabled={!isMyTurn}
                showShips={false}
                gridSize={gridSize}
                isOpponent
                maxWidth={Math.floor(CONTENT_WIDTH * 0.46)}
                variant="full"
              />
            </div>
          </div>
        ) : (
          /* ── Mobile: stacked layout per wireframe ── */
          <div style={{ ...styles.mobileStack, width: GRID_TOTAL_WIDTH }}>
            {/* Enemy board — large */}
            <GameBoard
              board={state.opponentBoard}
              onCellPress={isMyTurn && !provingShot ? handlePlayerAttack : undefined}
              disabled={!isMyTurn || provingShot}
              showShips={false}
              gridSize={gridSize}
              isOpponent
              maxWidth={GRID_TOTAL_WIDTH}
              variant="full"
            />

            {/* Turn lights + mini board — lights align with board outer edges */}
            <div style={{ ...styles.turnLightsRow, width: GRID_TOTAL_WIDTH }}>
              {/* YOU light — left edge of board */}
              <div
                className="naval-light"
                style={{
                  ...styles.navalLight,
                  backgroundColor: isMyTurn ? COLORS.accent.victory : COLORS.accent.fire,
                  boxShadow: isMyTurn
                    ? `0 0 14px ${COLORS.accent.victory}, 0 0 28px ${COLORS.accent.victory}50, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.25)`
                    : `0 0 6px ${COLORS.accent.fire}60, inset 0 -3px 6px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.08)`,
                  opacity: isMyTurn ? 1 : 0.45,
                }}
              >
                <span style={styles.lightText}>YOU</span>
              </div>

              {/* Player mini board — centered */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <GameBoard
                  board={state.playerBoard}
                  showShips
                  disabled
                  gridSize={gridSize}
                  maxWidth={MINI_BOARD_WIDTH}
                  variant="mini"
                  colLabelsBottom
                  lastAttackPosition={lastEnemyAttack}
                />
              </div>

              {/* ENEMY light — right edge of board */}
              <div
                className="naval-light"
                style={{
                  ...styles.navalLight,
                  backgroundColor: !isMyTurn ? COLORS.accent.victory : COLORS.accent.fire,
                  boxShadow: !isMyTurn
                    ? `0 0 14px ${COLORS.accent.victory}, 0 0 28px ${COLORS.accent.victory}50, inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.25)`
                    : `0 0 6px ${COLORS.accent.fire}60, inset 0 -3px 6px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.08)`,
                  opacity: !isMyTurn ? 1 : 0.45,
                }}
              >
                <span style={styles.lightText}>ENEMY</span>
              </div>
            </div>

            {/* ZK proving indicator */}
            {provingShot && (
              <div style={styles.provingIndicator}>
                <RadarSpinner size={14} />
                <span style={styles.provingText}>{t('battle.proving')}</span>
              </div>
            )}
          </div>
        )}

        {/* Surrender */}
        <div style={styles.surrenderArea}>
          <NavalButton
            title={t('battle.surrender')}
            onPress={handleSurrender}
            variant="danger"
            size="small"
          />
        </div>
      </div>

      {/* Naval light glow pulse animation */}
      <style>{`
        .naval-light {
          transition: background-color 0.4s ease, box-shadow 0.4s ease, opacity 0.4s ease;
          animation: lightPulse 2.5s ease-in-out infinite;
        }
        @keyframes lightPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
      `}</style>

      <SunkShipModal visible={showSunkModal} ship={sunkShip} onDismiss={() => setShowSunkModal(false)} />
      <ZKProofLog entries={zkLogs} />
    </PageShell>
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
    boxSizing: 'border-box' as const,
    alignItems: 'center',
  },
  // Desktop side-by-side
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
  // Mobile stacked layout
  mobileStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  // Turn lights row: lights flush with board outer edges
  turnLightsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Naval warship light — metallic circle with inner glow
  navalLight: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${COLORS.grid.border}`,
    position: 'relative' as const,
  },
  lightText: {
    fontFamily: FONTS.heading,
    fontSize: 8,
    color: '#fff',
    letterSpacing: 1.5,
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
    userSelect: 'none' as const,
  },
  // Surrender area
  surrenderArea: {
    marginTop: 'auto',
    flexShrink: 0,
    paddingBottom: SPACING.sm,
  },
  // PvP turn container
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
