import {
  BattleTracking,
  MatchStats,
  ShipKillEfficiency,
  LevelInfo,
} from './entities';
import type { PlacedShip, DifficultyLevel } from '../shared/entities';
import { DIFFICULTY_CONFIG, getRankConfig } from '../shared/constants';

const RANKS = [
  { rank: 'Recruit', xp: 0, motto: 'Every admiral started here' },
  { rank: 'Ensign', xp: 2000, motto: 'Learning the tides' },
  { rank: 'Lieutenant', xp: 6000, motto: 'A steady hand on the helm' },
  { rank: 'Commander', xp: 15000, motto: 'Fear follows your fleet' },
  { rank: 'Captain', xp: 30000, motto: 'Master of the seven seas' },
  { rank: 'Admiral', xp: 60000, motto: 'Legend of naval warfare' },
];

export { RANKS };

export function calculateScore(
  won: boolean,
  accuracy: number,
  shotsToWin: number,
  perfectKills: number,
  overkillShots: number,
  gridSize: number = 6,
  difficulty: DifficultyLevel = 'normal',
  enemySunkRatio: number = 0
): number {
  const multiplier = DIFFICULTY_CONFIG[difficulty].scoreMultiplier;

  if (!won) {
    const basePenalty = 300;
    const progressReduction = Math.round(enemySunkRatio * 200);
    const accuracyReduction = Math.round(accuracy);
    const penalty = Math.max(50, basePenalty - progressReduction - accuracyReduction);
    return -Math.round(penalty * multiplier);
  }

  const basePoints = 1000;
  const accuracyBonus = Math.round(accuracy * 5);
  const maxShots = gridSize * gridSize;
  const speedBonus = Math.max(0, (maxShots - shotsToWin) * 30);
  const perfectKillBonus = perfectKills * 150;
  const overkillPenalty = overkillShots * 50;

  const raw = basePoints + accuracyBonus + speedBonus + perfectKillBonus - overkillPenalty;
  return Math.max(0, Math.round(raw * multiplier));
}

export function computeMatchStats(
  tracking: BattleTracking,
  opponentShips: PlacedShip[],
  playerShips: PlacedShip[],
  won: boolean,
  gridSize: number = 6,
  difficulty: DifficultyLevel = 'normal'
): MatchStats {
  const shotsFired = tracking.playerShots.length;
  const shotsHit = tracking.playerShots.filter(s => s.result !== 'miss').length;
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
  const shotsToWin = won ? shotsFired : 0;

  const killEfficiency: ShipKillEfficiency[] = opponentShips
    .filter(s => s.isSunk)
    .map(ship => {
      const firstHitTurn = tracking.shipFirstHitTurn[ship.id];
      const sunkTurn = tracking.shipSunkTurn[ship.id];

      let actualShots: number;
      if (firstHitTurn != null && sunkTurn != null) {
        actualShots = tracking.playerShots.filter(
          s => s.turn >= firstHitTurn && s.turn <= sunkTurn
        ).length;
      } else {
        actualShots = ship.size;
      }

      return {
        shipId: ship.id,
        shipName: ship.name,
        shipSize: ship.size,
        idealShots: ship.size,
        actualShots: Math.max(actualShots, ship.size),
      };
    });

  const perfectKills = killEfficiency.filter(k => k.actualShots === k.idealShots).length;

  const firstHitTurns = Object.values(tracking.shipFirstHitTurn);
  const firstBloodTurn = firstHitTurns.length > 0 ? Math.min(...firstHitTurns) : 0;

  const shipsSurvived = playerShips.filter(s => !s.isSunk).length;

  const overkillShots = killEfficiency.reduce(
    (sum, k) => sum + Math.max(0, k.actualShots - k.idealShots), 0
  );

  const enemySunkCount = opponentShips.filter(s => s.isSunk).length;
  const enemySunkRatio = opponentShips.length > 0 ? enemySunkCount / opponentShips.length : 0;

  const score = calculateScore(won, accuracy, shotsFired, perfectKills, overkillShots, gridSize, difficulty, enemySunkRatio);

  return {
    score,
    accuracy,
    shotsFired,
    shotsHit,
    shotsToWin,
    shipsSurvived,
    totalShips: playerShips.length,
    longestStreak: tracking.longestStreak,
    firstBloodTurn,
    perfectKills,
    killEfficiency,
  };
}

export function getLevelInfo(totalXP: number): LevelInfo {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];

  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXP >= RANKS[i].xp) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] ?? RANKS[i];
      break;
    }
  }

  const xpInRank = totalXP - currentRank.xp;
  const xpRange = nextRank.xp - currentRank.xp;
  const progress = xpRange > 0 ? Math.min(xpInRank / xpRange, 1) : 1;

  const rankConfig = getRankConfig(currentRank.rank);

  return {
    rank: currentRank.rank,
    currentXP: totalXP,
    xpForCurrentRank: currentRank.xp,
    xpForNextRank: nextRank.xp,
    progress,
    motto: currentRank.motto,
    gridSize: rankConfig.gridSize,
    ships: rankConfig.ships,
  };
}
