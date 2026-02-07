# Battleship ZK — Statistics & Scoring Guide

## Why Stats Matter in Battleship

Battleship is a game of **decision under uncertainty** — the player never has complete information. Good stats measure **decision quality**, not just outcome. Each stat gives the player a mini-goal to chase, creating replayability without new content.

---

## Complete Stats Catalog

### Attack Stats (How You Hunt)

| Stat | Formula | What It Reveals | Benchmarks |
|------|---------|-----------------|------------|
| **Accuracy %** | `hits / totalShots * 100` | General shot efficiency. Are you wasting shots? | Beginner: ~30%, Good: ~50%, Expert: 65%+ |
| **Shots to Win** | `totalShots` (victory only) | The #1 skill metric. Lower = better. | 6x6 theoretical min: 7, good: 12-16 |
| **First Blood Turn** | `min(shipFirstHitTurn)` for opponent ships | Measures luck + opening strategy quality. Checkerboard strategy guarantees hit within ~9 turns on 6x6. | Good: turns 1-4, Average: 5-7, Unlucky: 8+ |
| **Longest Hit Streak** | max consecutive hits without a miss | Measures target mode skill — did you find the ship axis quickly? | 2-3 is normal, 4+ is skilled, 7 = all cells hit in a row (legendary) |
| **Overkill Shots** | shots fired on already-revealed cells (hit/miss/sunk) | Should ALWAYS be 0. Indicates UI confusion or player distraction. | 0 is expected, any > 0 is a problem |

### Efficiency Stats (How You Finish)

These are the stats that **teach** the player to improve.

| Stat | Formula | What It Teaches | Example |
|------|---------|-----------------|---------|
| **Kill Efficiency** | per ship: `(sunkTurn - firstHitTurn + 1)` | How many turns between first hit and sinking. Ideal = ship size. | Patrol Boat (size 2): ideal is 2 turns. If you took 5, you wasted 3 shots finding the second cell. |
| **Perfect Kills** | count of ships where actual shots == ship size | The "headshot" of Battleship. Sunk the ship without a single wasted shot after first contact. | 1 perfect kill per game is good, 3/3 is extraordinary |
| **Average Kill Time** | mean of all kill efficiencies | Aggregate version of kill efficiency across all ships. | Closer to 1.0x ship size = better |
| **Hunt/Target Ratio** | shots in hunt mode / shots in target mode | Reveals if you spend too long hunting vs efficiently following up hits. | Good: ~40% hunt / 60% target. If >60% hunt, you're slow to find ships. |

### Defense Stats (How You Position)

| Stat | Formula | What It Reveals | Insight |
|------|---------|-----------------|---------|
| **Survival Rate** | `shipsAlive / totalShips * 100` | Placement quality. If you won with 3/3 ships alive, your positioning was excellent. | 100% = perfect placement, 33% = barely survived |
| **Ships Survived** | count of non-sunk player ships | Simple and visually satisfying (ship icons in green/red). | Easy to understand at a glance |
| **Turns Before First Loss** | turn when player's first ship sank | How long your fleet stayed hidden. Higher = better placement strategy. | 6x6: good if > turn 10 |
| **Damage Taken** | total hits received on player board | How exposed your fleet was overall. | Lower is better |

---

## Active Stats (V2 Implementation)

### Primary Stats (Always Visible on Game Over)

| # | Stat | Display | Purpose |
|---|------|---------|---------|
| 1 | **Score** | Large number, prominent | The single number that summarizes everything |
| 2 | **Accuracy %** | Percentage with visual indicator | Easy to understand, motivating to improve |
| 3 | **Shots to Win** | Number (or "N/A" on defeat) | Performance context — "how fast did I win?" |
| 4 | **Ships Survived** | Visual: ship icons (green = alive, red = sunk) | Satisfying visual feedback on defense quality |

### Detailed Stats (Expandable "Battle Report" Section)

| # | Stat | Display | Purpose |
|---|------|---------|---------|
| 5 | **Kill Efficiency** | Per ship: horizontal bar (gold = ideal shots, red = extra shots) | Teaches player to detect ship axis quickly |
| 6 | **Longest Streak** | Number with label | Rewards aggressive, skilled targeting |
| 7 | **First Blood Turn** | "Turn N" with label | Contextualizes opening strategy luck vs skill |
| 8 | **Perfect Kills** | "N / total ships" with label | The ultimate achievement per ship — sunk without waste |

---

## Score Formula

```
Score = BasePoints + AccuracyBonus + SpeedBonus + PerfectKillBonus - OverkillPenalty
```

### Components

| Component | Formula | Range |
|-----------|---------|-------|
| **BasePoints** | Victory: 1000, Defeat: 200 | 200 — 1000 |
| **AccuracyBonus** | `accuracy * 5` | 0 — 500 |
| **SpeedBonus** | `max(0, (maxShots - shotsToWin) * 30)` — victory only | 0 — 870 (6x6) |
| **PerfectKillBonus** | `perfectKills * 150` | 0 — 450 (3 ships) |
| **OverkillPenalty** | `overkillShots * 50` | 0 — ∞ (but should be 0) |

`maxShots` = gridSize x gridSize (36 for 6x6, 100 for 10x10)

### Score Ranges (6x6)

| Performance | Estimated Score |
|-------------|----------------|
| Bad defeat | ~200 |
| Decent defeat | ~400 |
| Average victory | ~1,200 |
| Good victory | ~1,700 |
| Perfect victory | ~2,300+ |

---

## Player Leveling

### XP = Match Score

Every match awards XP equal to the match score. XP accumulates forever.

### Ranks

| Rank | XP Required | Motto |
|------|-------------|-------|
| Recruit | 0 | "Every admiral started here" |
| Ensign | 2,000 | "Learning the tides" |
| Lieutenant | 6,000 | "A steady hand on the helm" |
| Commander | 15,000 | "Fear follows your fleet" |
| Captain | 30,000 | "Master of the seven seas" |
| Admiral | 60,000 | "Legend of naval warfare" |

---

## Raw Data Required from Engine

To compute all active stats, the engine must track during gameplay:

| Data | Type | When Updated |
|------|------|--------------|
| `turnNumber` | number | Every attack (player or AI) |
| `playerShots[]` | `{ turn, position, result, shipId? }[]` | Every player attack |
| `aiShots[]` | same structure | Every AI attack |
| `currentStreak` | number | Reset on miss, increment on hit |
| `longestStreak` | number | `max(longestStreak, currentStreak)` on each hit |
| `shipFirstHitTurn` | `Record<shipId, turn>` | First hit on each opponent ship |
| `shipSunkTurn` | `Record<shipId, turn>` | When each opponent ship sinks |

All derived stats are computed once at game end from this raw data.

---

## Future Stats (Documented, Not Yet Implemented)

These stats are fully designed but deferred to future versions:

- **Hunt/Target Ratio** — requires tracking AI mode state per shot
- **Average Kill Time** — derivable from Kill Efficiency, redundant for now
- **Turns Before First Loss** — defense-focused, less relevant in single-player
- **Damage Taken** — simple but adds visual noise without much insight in V2
- **Overkill Shots** — tracked in score formula but not displayed as standalone stat yet
