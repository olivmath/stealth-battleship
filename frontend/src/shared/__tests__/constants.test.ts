import {
  RANK_PROGRESSION,
  getRankConfig,
  getShipDefinitionsForRank,
  getGridSizeForRank,
  getShipDefinitions,
  getColumnLabels,
  getRowLabels,
  getShipStyle,
  CLASSIC_SHIPS,
  SHIP_STYLES,
  DIFFICULTY_CONFIG,
} from '../constants';

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
  it('returns 5 classic ships for Recruit', () => {
    const ships = getShipDefinitionsForRank('Recruit');
    expect(ships).toHaveLength(5);
    expect(ships[0].name).toBe('Carrier');
  });

  it('returns 5 ships for Admiral', () => {
    const ships = getShipDefinitionsForRank('Admiral');
    expect(ships).toHaveLength(5);
  });

  it('returns Recruit ships for unknown rank', () => {
    const ships = getShipDefinitionsForRank('Fake');
    expect(ships).toEqual(getShipDefinitionsForRank('Recruit'));
  });
});

// --- getGridSizeForRank ---

describe('getGridSizeForRank', () => {
  it('returns 10 for all ranks', () => {
    expect(getGridSizeForRank('Recruit')).toBe(10);
    expect(getGridSizeForRank('Ensign')).toBe(10);
    expect(getGridSizeForRank('Lieutenant')).toBe(10);
    expect(getGridSizeForRank('Commander')).toBe(10);
    expect(getGridSizeForRank('Captain')).toBe(10);
    expect(getGridSizeForRank('Admiral')).toBe(10);
  });
});

// --- getShipDefinitions ---

describe('getShipDefinitions', () => {
  it('returns classic ships for any gridSize', () => {
    expect(getShipDefinitions(10)).toBe(CLASSIC_SHIPS);
  });
});

// --- getColumnLabels ---

describe('getColumnLabels', () => {
  it('returns 10 labels for gridSize 10', () => {
    const labels = getColumnLabels(10);
    expect(labels).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  });
});

// --- getRowLabels ---

describe('getRowLabels', () => {
  it('returns 10 numeric labels for gridSize 10', () => {
    const labels = getRowLabels(10);
    expect(labels).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
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

  it('each rank has 5 ships', () => {
    for (const config of RANK_PROGRESSION) {
      expect(config.ships).toHaveLength(5);
    }
  });

  it('all ranks use gridSize 10', () => {
    for (const config of RANK_PROGRESSION) {
      expect(config.gridSize).toBe(10);
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
