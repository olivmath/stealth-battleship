import {
  RANK_PROGRESSION,
  getRankConfig,
  getShipDefinitionsForRank,
  getGridSizeForRank,
  getShipDefinitions,
  getColumnLabels,
  getRowLabels,
  getShipStyle,
  COMPACT_SHIPS,
  CLASSIC_SHIPS,
  SHIP_STYLES,
  DIFFICULTY_CONFIG,
} from '../game';

// --- getRankConfig ---

describe('getRankConfig', () => {
  it('returns config for each known rank', () => {
    for (const config of RANK_PROGRESSION) {
      const result = getRankConfig(config.rank);
      expect(result).toBe(config);
    }
  });

  it('returns Recruit (first) for unknown rank', () => {
    const result = getRankConfig('NonExistent');
    expect(result).toBe(RANK_PROGRESSION[0]);
    expect(result.rank).toBe('Recruit');
  });
});

// --- getShipDefinitionsForRank ---

describe('getShipDefinitionsForRank', () => {
  it('returns ships for Recruit', () => {
    const ships = getShipDefinitionsForRank('Recruit');
    expect(ships).toHaveLength(3);
    expect(ships[0].name).toBe('Scout');
  });

  it('returns ships for Admiral', () => {
    const ships = getShipDefinitionsForRank('Admiral');
    expect(ships).toHaveLength(5);
    expect(ships.some(s => s.name === 'Carrier')).toBe(true);
  });

  it('returns Recruit ships for unknown rank', () => {
    const ships = getShipDefinitionsForRank('Fake');
    expect(ships).toEqual(getShipDefinitionsForRank('Recruit'));
  });
});

// --- getGridSizeForRank ---

describe('getGridSizeForRank', () => {
  it('returns 6 for Recruit', () => {
    expect(getGridSizeForRank('Recruit')).toBe(6);
  });

  it('returns 6 for Ensign', () => {
    expect(getGridSizeForRank('Ensign')).toBe(6);
  });

  it('returns 8 for Lieutenant', () => {
    expect(getGridSizeForRank('Lieutenant')).toBe(8);
  });

  it('returns 10 for Captain', () => {
    expect(getGridSizeForRank('Captain')).toBe(10);
  });

  it('returns 10 for Admiral', () => {
    expect(getGridSizeForRank('Admiral')).toBe(10);
  });
});

// --- getShipDefinitions ---

describe('getShipDefinitions', () => {
  it('returns compact ships for gridSize 6', () => {
    expect(getShipDefinitions(6)).toBe(COMPACT_SHIPS);
  });

  it('returns classic ships for gridSize 10', () => {
    expect(getShipDefinitions(10)).toBe(CLASSIC_SHIPS);
  });

  it('returns compact ships for gridSize 8', () => {
    expect(getShipDefinitions(8)).toBe(COMPACT_SHIPS);
  });
});

// --- getColumnLabels ---

describe('getColumnLabels', () => {
  it('returns 6 labels for gridSize 6', () => {
    const labels = getColumnLabels(6);
    expect(labels).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('returns 10 labels for gridSize 10', () => {
    const labels = getColumnLabels(10);
    expect(labels).toHaveLength(10);
    expect(labels[0]).toBe('A');
    expect(labels[9]).toBe('J');
  });

  it('returns 8 labels for gridSize 8', () => {
    const labels = getColumnLabels(8);
    expect(labels).toHaveLength(8);
    expect(labels[7]).toBe('H');
  });
});

// --- getRowLabels ---

describe('getRowLabels', () => {
  it('returns 6 numeric labels for gridSize 6', () => {
    const labels = getRowLabels(6);
    expect(labels).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('returns 10 labels for gridSize 10', () => {
    const labels = getRowLabels(10);
    expect(labels).toHaveLength(10);
    expect(labels[0]).toBe('1');
    expect(labels[9]).toBe('10');
  });
});

// --- getShipStyle ---

describe('getShipStyle', () => {
  it('returns correct style for carrier', () => {
    const style = getShipStyle('carrier');
    expect(style).toEqual(SHIP_STYLES['carrier']);
  });

  it('strips numeric suffix to find style', () => {
    const style = getShipStyle('patrol-1');
    expect(style).toEqual(SHIP_STYLES['patrol']);
  });

  it('strips numeric suffix for multi-digit', () => {
    const style = getShipStyle('destroyer-2');
    expect(style).toEqual(SHIP_STYLES['destroyer']);
  });

  it('returns fallback for unknown ship ID', () => {
    const style = getShipStyle('totally-unknown-thing');
    expect(style).toEqual({ color: '#4a5568', label: 'Unknown' });
  });

  it('returns correct style for each known ship type', () => {
    for (const key of Object.keys(SHIP_STYLES)) {
      const style = getShipStyle(key);
      expect(style.color).toBeTruthy();
      expect(style.label).toBeTruthy();
    }
  });
});

// --- RANK_PROGRESSION data integrity ---

describe('RANK_PROGRESSION', () => {
  it('has 6 ranks', () => {
    expect(RANK_PROGRESSION).toHaveLength(6);
  });

  it('has unique rank names', () => {
    const names = RANK_PROGRESSION.map(r => r.rank);
    expect(new Set(names).size).toBe(6);
  });

  it('each rank has at least 1 ship', () => {
    for (const config of RANK_PROGRESSION) {
      expect(config.ships.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('grid sizes are valid options', () => {
    for (const config of RANK_PROGRESSION) {
      expect([6, 8, 10]).toContain(config.gridSize);
    }
  });

  it('all ships have valid size > 0', () => {
    for (const config of RANK_PROGRESSION) {
      for (const ship of config.ships) {
        expect(ship.size).toBeGreaterThan(0);
      }
    }
  });
});

// --- DIFFICULTY_CONFIG ---

describe('DIFFICULTY_CONFIG', () => {
  it('has all three difficulty levels', () => {
    expect(DIFFICULTY_CONFIG).toHaveProperty('easy');
    expect(DIFFICULTY_CONFIG).toHaveProperty('normal');
    expect(DIFFICULTY_CONFIG).toHaveProperty('hard');
  });

  it('easy has lowest score multiplier', () => {
    expect(DIFFICULTY_CONFIG.easy.scoreMultiplier).toBeLessThan(DIFFICULTY_CONFIG.normal.scoreMultiplier);
  });

  it('hard has highest score multiplier', () => {
    expect(DIFFICULTY_CONFIG.hard.scoreMultiplier).toBeGreaterThan(DIFFICULTY_CONFIG.normal.scoreMultiplier);
  });

  it('easy does not use checkerboard', () => {
    expect(DIFFICULTY_CONFIG.easy.useCheckerboard).toBe(false);
  });

  it('normal uses checkerboard and axis detection', () => {
    expect(DIFFICULTY_CONFIG.normal.useCheckerboard).toBe(true);
    expect(DIFFICULTY_CONFIG.normal.useAxisDetection).toBe(true);
  });

  it('hard uses center weight', () => {
    expect(DIFFICULTY_CONFIG.hard.centerWeight).toBe(true);
  });

  it('delay ranges are valid (min < max)', () => {
    for (const key of ['easy', 'normal', 'hard'] as const) {
      expect(DIFFICULTY_CONFIG[key].delayMin).toBeLessThan(DIFFICULTY_CONFIG[key].delayMax);
    }
  });
});
