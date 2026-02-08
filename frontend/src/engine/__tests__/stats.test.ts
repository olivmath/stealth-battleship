import { calculateScore, computeMatchStats, getLevelInfo, RANKS } from '../stats';
import { BattleTracking, PlacedShip } from '../../types/game';

// --- calculateScore ---

describe('calculateScore', () => {
  it('returns base 1000 for victory with 0 accuracy', () => {
    const score = calculateScore(true, 0, 36, 0, 0, 6, 'normal');
    // base=1000, accuracy=0, speed=max(0, (36-36)*30)=0, perfect=0, overkill=0
    expect(score).toBe(1000);
  });

  it('returns base 200 for defeat', () => {
    const score = calculateScore(false, 0, 0, 0, 0, 6, 'normal');
    expect(score).toBe(200);
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

  it('no speed bonus for defeat', () => {
    const defeat = calculateScore(false, 50, 10, 0, 0, 6, 'normal');
    // base=200, accuracy=250, speed=0 (defeat), perfect=0
    expect(defeat).toBe(450);
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

  it('applies difficulty multiplier 0.5x for easy', () => {
    const easy = calculateScore(true, 50, 36, 0, 0, 6, 'easy');
    const normal = calculateScore(true, 50, 36, 0, 0, 6, 'normal');
    expect(easy).toBe(Math.round(normal * 0.5));
  });

  it('applies difficulty multiplier 1.5x for hard', () => {
    const hard = calculateScore(true, 50, 36, 0, 0, 6, 'hard');
    const normal = calculateScore(true, 50, 36, 0, 0, 6, 'normal');
    expect(hard).toBe(Math.round(normal * 1.5));
  });

  it('never returns negative score', () => {
    const score = calculateScore(false, 0, 0, 0, 100, 6, 'normal');
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

  it('computes kill efficiency for sunk ships (counts only shots at that ship)', () => {
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
    // Only 2 shots targeted ship 'a' (the miss had no shipId), so actualShots = 2
    expect(stats.killEfficiency[0].actualShots).toBe(2);
  });

  it('counts perfect kills', () => {
    const tracking = makeTracking({
      playerShots: [
        { turn: 1, position: { row: 0, col: 0 }, result: 'hit', shipId: 'a' },
        { turn: 2, position: { row: 0, col: 1 }, result: 'sunk', shipId: 'a' },
      ],
      shipFirstHitTurn: { a: 1 },
      shipSunkTurn: { a: 2 },
    });

    const opponentShips = [makeShip('a', 2, true)];
    const stats = computeMatchStats(tracking, opponentShips, [], true, 6, 'normal');
    expect(stats.perfectKills).toBe(1);
  });

  it('kill efficiency counts only shots that hit the ship (no false overkill)', () => {
    // Ship of size 2: only 2 shots actually targeted ship 'a'
    // The 3 misses should NOT inflate actualShots
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

    // Only 2 shots had shipId 'a', so actualShots = idealShots = 2 (perfect kill)
    expect(stats.killEfficiency[0].actualShots).toBe(2);
    expect(stats.killEfficiency[0].idealShots).toBe(2);
    expect(stats.perfectKills).toBe(1);
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
