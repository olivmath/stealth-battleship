import { calculateScore, computeMatchStats, getLevelInfo, RANKS } from '../interactor';
import { BattleTracking, PlacedShip } from '../../shared/entities';

// --- calculateScore ---

describe('calculateScore', () => {
  it('returns base 1000 for victory with 0 accuracy', () => {
    const score = calculateScore(true, 0, 36, 0, 0, 6, 'normal');
    // base=1000, accuracy=0, speed=max(0, (36-36)*30)=0, perfect=0, overkill=0
    expect(score).toBe(1000);
  });

  it('returns negative score for defeat (proportional penalty)', () => {
    // 0% accuracy, 0 enemy ships sunk → max penalty = -300
    const score = calculateScore(false, 0, 0, 0, 0, 6, 'normal', 0);
    expect(score).toBe(-300);
    expect(score).toBeLessThan(0);
  });

  it('adds accuracy bonus', () => {
    const score100 = calculateScore(true, 100, 36, 0, 0, 6, 'normal');
    const score50 = calculateScore(true, 50, 36, 0, 0, 6, 'normal');
    expect(score100).toBeGreaterThan(score50);
    // accuracy bonus = accuracy * 5
    expect(score100 - score50).toBe(250); // (100-50) * 5
  });

  it('adds speed bonus for victory', () => {
    // Win in 7 shots on 6x6: speed = (36-7)*30 = 870
    const fast = calculateScore(true, 100, 7, 0, 0, 6, 'normal');
    // Win in 36 shots on 6x6: speed = 0
    const slow = calculateScore(true, 100, 36, 0, 0, 6, 'normal');
    expect(fast).toBeGreaterThan(slow);
  });

  it('defeat penalty reduced by accuracy and progress', () => {
    // 50% accuracy, 0.5 enemy sunk ratio → penalty = max(50, 300 - 100 - 50) = 150
    const defeat = calculateScore(false, 50, 10, 0, 0, 6, 'normal', 0.5);
    expect(defeat).toBe(-150);
    // Worse loss: 0% accuracy, 0 sunk
    const badDefeat = calculateScore(false, 0, 10, 0, 0, 6, 'normal', 0);
    expect(badDefeat).toBe(-300);
    // Bad defeat is more negative than close defeat
    expect(badDefeat).toBeLessThan(defeat);
  });

  it('adds perfect kill bonus', () => {
    const withPerfect = calculateScore(true, 50, 36, 3, 0, 6, 'normal');
    const noPerfect = calculateScore(true, 50, 36, 0, 0, 6, 'normal');
    expect(withPerfect - noPerfect).toBe(450); // 3 * 150
  });

  it('subtracts overkill penalty', () => {
    const noOverkill = calculateScore(true, 50, 36, 0, 0, 6, 'normal');
    const withOverkill = calculateScore(true, 50, 36, 0, 5, 6, 'normal');
    expect(noOverkill - withOverkill).toBe(250); // 5 * 50
  });

  it('applies difficulty multiplier 0.5x for easy (victory)', () => {
    const easy = calculateScore(true, 50, 36, 0, 0, 6, 'easy');
    const normal = calculateScore(true, 50, 36, 0, 0, 6, 'normal');
    expect(easy).toBe(Math.round(normal * 0.5));
  });

  it('applies difficulty multiplier 1.5x for hard (victory)', () => {
    const hard = calculateScore(true, 50, 36, 0, 0, 6, 'hard');
    const normal = calculateScore(true, 50, 36, 0, 0, 6, 'normal');
    expect(hard).toBe(Math.round(normal * 1.5));
  });

  it('applies difficulty multiplier to defeat penalty', () => {
    const easy = calculateScore(false, 0, 0, 0, 0, 6, 'easy', 0);
    const normal = calculateScore(false, 0, 0, 0, 0, 6, 'normal', 0);
    const hard = calculateScore(false, 0, 0, 0, 0, 6, 'hard', 0);
    // Penalty = 300 * multiplier
    expect(easy).toBe(-150);   // 300 * 0.5
    expect(normal).toBe(-300); // 300 * 1.0
    expect(hard).toBe(-450);   // 300 * 1.5
  });

  it('defeat penalty has minimum of 50 (before multiplier)', () => {
    // 100% accuracy + all enemy sunk = max reductions → penalty = max(50, 300-200-100) = 50
    const score = calculateScore(false, 100, 0, 0, 0, 6, 'normal', 1.0);
    expect(score).toBe(-50);
  });

  it('victory score never goes below 0', () => {
    const score = calculateScore(true, 0, 36, 0, 100, 6, 'normal');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('works with 10x10 grid', () => {
    // speed = (100-17)*30 = 2490
    const score = calculateScore(true, 100, 17, 5, 0, 10, 'normal');
    expect(score).toBeGreaterThan(0);
  });
});

// --- computeMatchStats ---

describe('computeMatchStats', () => {
  function makeTracking(overrides: Partial<BattleTracking> = {}): BattleTracking {
    return {
      turnNumber: 10,
      playerShots: [],
      opponentShots: [],
      currentStreak: 0,
      longestStreak: 0,
      opponentStreak: 0,
      opponentLongestStreak: 0,
      shipFirstHitTurn: {},
      shipSunkTurn: {},
      ...overrides,
    };
  }

  function makeShip(id: string, size: number, isSunk: boolean): PlacedShip {
    return {
      id,
      name: id,
      size,
      positions: Array.from({ length: size }, (_, i) => ({ row: 0, col: i })),
      orientation: 'horizontal' as const,
      hits: isSunk ? size : 0,
      isSunk,
    };
  }

  it('computes accuracy correctly', () => {
    const tracking = makeTracking({
      playerShots: [
        { turn: 1, position: { row: 0, col: 0 }, result: 'hit', shipId: 'a' },
        { turn: 3, position: { row: 1, col: 0 }, result: 'miss' },
        { turn: 5, position: { row: 0, col: 1 }, result: 'hit', shipId: 'a' },
        { turn: 7, position: { row: 2, col: 0 }, result: 'miss' },
      ],
    });
    const opponentShips = [makeShip('a', 2, true)];
    const playerShips = [makeShip('p1', 2, false)];

    const stats = computeMatchStats(tracking, opponentShips, playerShips, true, 6, 'normal');
    expect(stats.accuracy).toBe(50); // 2 hits / 4 shots
    expect(stats.shotsFired).toBe(4);
    expect(stats.shotsHit).toBe(2);
  });

  it('computes shotsToWin only on victory', () => {
    const tracking = makeTracking({
      playerShots: [
        { turn: 1, position: { row: 0, col: 0 }, result: 'hit' },
        { turn: 3, position: { row: 0, col: 1 }, result: 'miss' },
      ],
    });
    const ships = [makeShip('a', 2, false)];

    const win = computeMatchStats(tracking, ships, ships, true, 6, 'normal');
    expect(win.shotsToWin).toBe(2);

    const loss = computeMatchStats(tracking, ships, ships, false, 6, 'normal');
    expect(loss.shotsToWin).toBe(0);
  });

  it('counts ships survived', () => {
    const playerShips = [
      makeShip('p1', 2, false),
      makeShip('p2', 2, true),
      makeShip('p3', 3, false),
    ];

    const stats = computeMatchStats(makeTracking(), [], playerShips, true, 6, 'normal');
    expect(stats.shipsSurvived).toBe(2);
    expect(stats.totalShips).toBe(3);
  });

  it('tracks longest streak', () => {
    const tracking = makeTracking({ longestStreak: 5 });
    const stats = computeMatchStats(tracking, [], [], true, 6, 'normal');
    expect(stats.longestStreak).toBe(5);
  });

  it('finds first blood turn', () => {
    const tracking = makeTracking({
      shipFirstHitTurn: { 'ship-a': 3, 'ship-b': 7 },
    });
    const stats = computeMatchStats(tracking, [], [], true, 6, 'normal');
    expect(stats.firstBloodTurn).toBe(3);
  });

  it('returns 0 firstBloodTurn when no hits', () => {
    const stats = computeMatchStats(makeTracking(), [], [], false, 6, 'normal');
    expect(stats.firstBloodTurn).toBe(0);
  });

  it('computes kill efficiency using shots in the hit-to-sunk window', () => {
    const tracking = makeTracking({
      playerShots: [
        { turn: 1, position: { row: 0, col: 0 }, result: 'hit', shipId: 'a' },
        { turn: 3, position: { row: 1, col: 0 }, result: 'miss' },
        { turn: 5, position: { row: 0, col: 1 }, result: 'sunk', shipId: 'a' },
      ],
      shipFirstHitTurn: { a: 1 },
      shipSunkTurn: { a: 5 },
    });

    const opponentShips = [makeShip('a', 2, true)];
    const stats = computeMatchStats(tracking, opponentShips, [], true, 6, 'normal');

    expect(stats.killEfficiency).toHaveLength(1);
    expect(stats.killEfficiency[0].shipName).toBe('a');
    expect(stats.killEfficiency[0].idealShots).toBe(2);
    // 3 shots in window [turn 1, turn 5] (hit, miss, sunk) → actualShots = 3
    expect(stats.killEfficiency[0].actualShots).toBe(3);
  });

  it('counts perfect kills when no misses in window', () => {
    // 2 consecutive hits with no misses → perfect kill
    const tracking = makeTracking({
      playerShots: [
        { turn: 1, position: { row: 0, col: 0 }, result: 'hit', shipId: 'a' },
        { turn: 3, position: { row: 0, col: 1 }, result: 'sunk', shipId: 'a' },
      ],
      shipFirstHitTurn: { a: 1 },
      shipSunkTurn: { a: 3 },
    });

    const opponentShips = [makeShip('a', 2, true)];
    const stats = computeMatchStats(tracking, opponentShips, [], true, 6, 'normal');
    // Only 2 player shots in window [1, 3] (turns 1 and 3 — turn 2 was opponent)
    expect(stats.killEfficiency[0].actualShots).toBe(2);
    expect(stats.perfectKills).toBe(1);
  });

  it('kill efficiency counts misses in the hunt window as overkill', () => {
    // Ship of size 2: hit at turn 1, 3 misses, sunk at turn 5
    // All 5 shots are in window [1, 5] → actualShots = 5, not a perfect kill
    const tracking = makeTracking({
      playerShots: [
        { turn: 1, position: { row: 0, col: 0 }, result: 'hit', shipId: 'a' },
        { turn: 2, position: { row: 1, col: 0 }, result: 'miss' },
        { turn: 3, position: { row: 2, col: 0 }, result: 'miss' },
        { turn: 4, position: { row: 3, col: 0 }, result: 'miss' },
        { turn: 5, position: { row: 0, col: 1 }, result: 'sunk', shipId: 'a' },
      ],
      shipFirstHitTurn: { a: 1 },
      shipSunkTurn: { a: 5 },
    });

    const opponentShips = [makeShip('a', 2, true)];
    const stats = computeMatchStats(tracking, opponentShips, [], true, 6, 'normal');

    expect(stats.killEfficiency[0].actualShots).toBe(5);
    expect(stats.killEfficiency[0].idealShots).toBe(2);
    expect(stats.perfectKills).toBe(0);
  });

  it('handles 0 accuracy when no shots fired', () => {
    const stats = computeMatchStats(makeTracking(), [], [], false, 6, 'normal');
    expect(stats.accuracy).toBe(0);
  });
});

// --- getLevelInfo ---

describe('getLevelInfo', () => {
  it('returns Recruit for 0 XP', () => {
    const info = getLevelInfo(0);
    expect(info.rank).toBe('Recruit');
    expect(info.currentXP).toBe(0);
    expect(info.progress).toBeGreaterThanOrEqual(0);
  });

  it('returns Ensign for 2000 XP', () => {
    const info = getLevelInfo(2000);
    expect(info.rank).toBe('Ensign');
  });

  it('returns Lieutenant for 6000 XP', () => {
    const info = getLevelInfo(6000);
    expect(info.rank).toBe('Lieutenant');
  });

  it('returns Commander for 15000 XP', () => {
    const info = getLevelInfo(15000);
    expect(info.rank).toBe('Commander');
  });

  it('returns Captain for 30000 XP', () => {
    const info = getLevelInfo(30000);
    expect(info.rank).toBe('Captain');
  });

  it('returns Admiral for 60000 XP', () => {
    const info = getLevelInfo(60000);
    expect(info.rank).toBe('Admiral');
    expect(info.progress).toBe(1);
  });

  it('returns correct rank for mid-range XP', () => {
    const info = getLevelInfo(4000); // between Ensign (2000) and Lieutenant (6000)
    expect(info.rank).toBe('Ensign');
    expect(info.progress).toBeCloseTo(0.5, 1);
  });

  it('returns progress 0 at rank threshold', () => {
    const info = getLevelInfo(6000); // exactly Lieutenant
    expect(info.rank).toBe('Lieutenant');
    expect(info.progress).toBeCloseTo(0, 1);
  });

  it('handles XP well above Admiral', () => {
    const info = getLevelInfo(999999);
    expect(info.rank).toBe('Admiral');
    expect(info.progress).toBe(1);
  });

  it('RANKS array has 6 entries in ascending XP order', () => {
    expect(RANKS).toHaveLength(6);
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].xp).toBeGreaterThan(RANKS[i - 1].xp);
    }
  });
});
