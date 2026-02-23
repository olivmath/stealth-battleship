# Product Requirements Document: Stealth Battleship — V2

## Overview

**Product:** Stealth Battleship - Mobile naval combat game
**Platform:** iOS & Android (React Native / Expo)
**Version:** 2.0.0 (Feature-Complete Single Player)
**Status:** In Development
**Previous:** PRD.md (V1 — Visual MVP, completed)

## Vision

A polished, military-themed Battleship game for mobile with deep stats tracking, player progression, and configurable gameplay. Single-player vs AI with full analytics, leveling system, and match history. Future versions will integrate Zero-Knowledge Proofs for trustless PvP multiplayer.

## Target Audience

- Casual mobile gamers who enjoy quick strategy sessions (3-5 min per match)
- Players who want to track improvement and compete against their own scores
- Players familiar with classic Battleship who want a modern mobile experience

---

## Game Rules

### Grid Options (configurable in Settings)

| Grid | Size | Ships | Total Cells | Density |
|------|------|-------|-------------|---------|
| **Compact (default)** | 6x6 | 2x Patrol Boat (2) + 1x Destroyer (3) | 7 | ~19% |
| **Classic** | 10x10 | Carrier (5) + Battleship (4) + Cruiser (3) + Submarine (3) + Destroyer (2) | 17 | 17% |

### Core Rules

| Rule | Value |
|------|-------|
| Turn Order | Player fires, then AI fires |
| Win Condition | All opponent ships sunk |
| Adjacent Ships | Allowed |
| Ship Orientation | Horizontal or Vertical |

---

## Screen Flow

```
Login → Menu → Tutorial (carousel) → Ship Placement → Battle → Game Over → Menu
                                                                          ↘ Placement (replay)

Menu also links to:
  → Settings (grid size, battle view mode)
  → Match History → Match Detail
```

All gameplay transitions use `router.replace()` to prevent back-navigation.

---

## Screens

### 1. Login (index.tsx)

- Username text input with naval-themed gradient background
- "Enter Battle" button
- Persists username in AsyncStorage

### 2. Menu (menu.tsx)

- Welcome message with player name
- **Player Level** display: rank title, XP progress bar, rank icon
- Player stats: Wins / Losses / Win Rate
- **Match History** section: scrollable list of past matches sorted by score
  - Each item shows: date, result (W/L), score, grid size
  - Tapping opens Match Detail with full stats
- "Start Battle" button → Tutorial → Placement
- "PvP Online" button (disabled, "Coming Soon")
- Settings gear icon → Settings screen

### 3. Tutorial (tutorial.tsx)

- Horizontal FlatList carousel (5 slides)
- Slides: How to Play, Your Fleet, Take Your Shot, Sink the Ship, Ready Commander
- Pagination dots + Next/Skip buttons
- Illustrations rendered with native Views (mini grids, ship shapes)

### 4. Ship Placement (placement.tsx)

- Grid (6x6 or 10x10 based on settings)
- **Drag-and-drop** ship placement from selector onto grid
  - PanGestureHandler for drag
  - **Tap ship to rotate** (toggle horizontal/vertical)
  - Ghost preview follows finger position
  - Generous touch hitbox for mobile
- **Tap placed ship to remove** it (returns to selector)
- Auto-place button for random placement
- "Ready" button (enabled when all ships placed)

### 5. Battle (battle.tsx)

Two configurable view modes (persisted in Settings):

**Option A — Stacked (default):**
- Two boards same size, enemy on top (tappable), player on bottom (display only)
- Both visible simultaneously

**Option B — Swipe:**
- One board per screen at full size
- Enemy board shown first
- Swipe right / tap right arrow → player board
- Swipe left / tap left arrow → enemy board

**Common to both modes:**
- Turn indicator: "Your Turn" / "Enemy Firing..."
- Fleet status showing remaining ships for both sides
- AI fires after variable delay (600-1200ms)
- Haptic feedback on every action
- **Sunk ship animation modal**: when any ship sinks, a brief overlay shows a ship graphic (matching sunk ship size) with sinking animation. Auto-dismiss ~1.5s.

### 6. Game Over (gameover.tsx)

- Victory or Defeat display with score
- **Primary Stats** (always visible):
  - Score (large, prominent)
  - Accuracy %
  - Shots to Win / Total Shots
  - Ships Survived (visual: ship icons green/red)
- **Battle Report** (expandable detail section):
  - Kill Efficiency per ship (bar: gold = ideal shots, red = extra shots)
  - Longest Hit Streak
  - First Blood Turn
  - Perfect Kills (N / total ships)
- **XP Earned** display with level progress
- Level-up notification if threshold crossed
- "Play Again" → Placement
- "Return to Base" → Menu
- Match auto-saved to history

### 7. Settings (settings.tsx)

- **Grid Size**: 6x6 / 10x10 toggle
- **Battle View**: Option A (Stacked) / Option B (Swipe) toggle
- Persisted in AsyncStorage

### 8. Match Detail (modal or screen from history)

- Full stats from a specific past match
- Same layout as Game Over Battle Report
- Back button to menu

---

## Statistics System

### Raw Data Tracked During Battle

The engine records these in real-time during gameplay:

| Data | Type | Description |
|------|------|-------------|
| `turnNumber` | number | Increments on every attack (player or AI) |
| `playerShots[]` | array | `{ turn, position, result, shipId? }` for each player shot |
| `aiShots[]` | array | Same structure for AI shots |
| `currentStreak` | number | Current consecutive hits (resets on miss) |
| `longestStreak` | number | Max streak achieved |
| `shipFirstHitTurn` | map | `{ shipId: turnNumber }` — when each ship first took damage |
| `shipSunkTurn` | map | `{ shipId: turnNumber }` — when each ship sank |

### Derived Stats (calculated at game end)

#### Attack Stats

| Stat | Formula | What it reveals |
|------|---------|-----------------|
| **Accuracy %** | `hits / totalShots * 100` | General efficiency. Beginner: ~30%, Good: ~50%, Expert: 65%+ |
| **Shots to Win** | `totalShots` (win only) | Primary skill metric. Lower = better. 6x6 theoretical min: 7 |
| **First Blood Turn** | `min(shipFirstHitTurn values)` for opponent ships | Luck + opening strategy |
| **Longest Hit Streak** | `longestStreak` | Target mode skill — found the axis quickly? |
| **Overkill Shots** | shots on already-revealed cells | Should always be 0. UI/attention penalty |

#### Efficiency Stats

| Stat | Formula | What it teaches |
|------|---------|-----------------|
| **Kill Efficiency** | per ship: `(sunkTurn - firstHitTurn + 1)` vs `shipSize` | Ideal = ship size. Measures axis detection skill |
| **Perfect Kills** | count of ships where killEfficiency == shipSize | The "headshot" — sunk without a single wasted shot |
| **Average Kill Time** | mean of all kill efficiencies | Aggregate efficiency |
| **Hunt/Target Ratio** | shots in hunt mode / shots in target mode | Good player: ~40% hunt, ~60% target |

#### Defense Stats

| Stat | Formula | What it reveals |
|------|---------|-----------------|
| **Survival Rate** | `shipsAlive / totalShips * 100` | Placement quality |
| **Ships Survived** | count of non-sunk player ships | Simple satisfaction metric |
| **Turns Before First Loss** | turn when player's first ship sank | Placement quality indicator |
| **Damage Taken** | total hits on player board | Exposure metric |

### Score Formula

```
Score = BasePoints + AccuracyBonus + SpeedBonus + PerfectKillBonus - OverkillPenalty

BasePoints:
  Victory  = 1000
  Defeat   = 200

AccuracyBonus:
  accuracy * 5  (max 500 at 100%)

SpeedBonus (victory only):
  max(0, (maxShots - shotsToWin) * 30)
  where maxShots = gridSize * gridSize (36 for 6x6, 100 for 10x10)

PerfectKillBonus:
  perfectKills * 150

OverkillPenalty:
  overkillShots * 50
```

**Score ranges (6x6):**

| Performance | Score |
|-------------|-------|
| Bad defeat | ~200 |
| Decent defeat | ~400 |
| Average victory | ~1,200 |
| Good victory | ~1,700 |
| Perfect victory | ~2,300+ |

---

## Player Leveling System

### XP = Match Score

Every match awards XP equal to the match score. XP accumulates across all matches.

### Ranks

| Rank | XP Threshold | Motto |
|------|-------------|-------|
| Recruit | 0 | "Every admiral started here" |
| Ensign | 2,000 | "Learning the tides" |
| Lieutenant | 6,000 | "A steady hand on the helm" |
| Commander | 15,000 | "Fear follows your fleet" |
| Captain | 30,000 | "Master of the seven seas" |
| Admiral | 60,000 | "Legend of naval warfare" |

### Display

- Menu: rank title + XP progress bar below player name
- Game Over: XP earned this match + progress toward next rank
- Level-up: notification overlay when crossing threshold

---

## Match History

### Storage Schema

```typescript
interface MatchRecord {
  id: string;              // unique ID (timestamp-based)
  date: string;            // ISO date
  result: 'victory' | 'defeat';
  score: number;
  gridSize: 6 | 10;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  shotsToWin: number;
  shipsLost: number;
  totalShips: number;
  longestStreak: number;
  firstBloodTurn: number;
  perfectKills: number;
  overkillShots: number;
  turnCount: number;
  killEfficiency: { shipName: string; ideal: number; actual: number }[];
  damageTaken: number;
}
```

Stored as `@battleship_history` in AsyncStorage (array of MatchRecord, most recent first).

---

## UI/UX Additions

### Sunk Ship Animation Modal

- Triggered when any ship sinks (player or opponent)
- Overlay shows a ship graphic matching the sunk ship's size
- Animation: ship tilts and slides down (sinking effect) using Reanimated
- Duration: ~1.5 seconds, auto-dismiss
- Semi-transparent dark backdrop

### Radar Loading Spinner

- Replaces default ActivityIndicator across the app
- Circular radar sweep: rotating line from center
- Dots appear as sweep line passes over their position
- Reanimated for smooth 360-degree rotation loop
- Used on: font loading, any async loading states

### Drag-and-Drop Ship Placement

- Ships dragged from selector bar onto grid
- PanGestureHandler tracks finger position
- Ghost preview snaps to nearest valid grid position
- Tap ship during drag or on grid to toggle orientation
- Invalid positions show red-tinted preview
- Release to place, tap placed ship to remove

---

## Non-Functional Requirements

### Performance
- 60fps during animations and drag operations
- Cell renders use React.memo with shallow comparison
- AI computation must not block UI thread
- Drag-and-drop must feel responsive (< 16ms per frame)

### Design
- Colors: Navy (#0a0e1a → #0c2d48), Gold (#f59e0b), Fire Red (#ef4444), Steel Gray (#4a5568)
- Fonts: Orbitron (headings) + Rajdhani (body)
- Grid borders: Subtle radar/sonar (#1e3a5f)
- Cell size: Computed from screen width for responsiveness

### Haptics

| Event | Feedback Type |
|-------|--------------|
| Miss | Light |
| Hit | Medium |
| Sunk | Heavy + Notification |
| Invalid Placement | Error |
| Button Press | Light |
| Ship Pickup (drag start) | Light |
| Ship Drop (valid) | Medium |
| Ship Rotate | Light |
| Level Up | Heavy + Success |

---

## Success Criteria

1. App loads without errors on iOS and Android
2. Complete game flow works end-to-end with tutorial
3. AI provides reasonable challenge on both grid sizes
4. All stats tracked correctly and displayed at game end
5. Match history persists and displays correctly
6. Player leveling works with accurate XP accumulation
7. Drag-and-drop placement feels natural on mobile
8. Both battle view modes work correctly
9. Settings persist across app restarts
10. Animations and haptics provide satisfying feedback
11. No back-navigation to mid-game states

---

## Out of Scope (Future Versions)

- Zero-Knowledge Proof integration
- PvP multiplayer (online)
- Blockchain/wallet integration
- Sound effects / music
- Difficulty levels for AI
- Achievements / badges system
- Custom ship skins
- Replay system
