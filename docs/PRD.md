# Product Requirements Document: Battleship ZK

## Overview

**Product:** Battleship ZK - Mobile naval combat game
**Platform:** iOS & Android (React Native / Expo)
**Version:** 1.0.0 (Visual MVP)
**Status:** In Development

## Vision

A polished, military-themed Battleship game for mobile with a dark naval aesthetic. This MVP focuses on single-player vs AI gameplay with full visual experience. Future versions will integrate Zero-Knowledge Proofs for trustless PvP multiplayer.

## Target Audience

- Casual mobile gamers who enjoy quick strategy sessions (3-5 min per match)
- Players familiar with classic Battleship who want a modern mobile experience

## Scope - V1 (Visual MVP)

### In Scope

- Single-player vs AI gameplay
- Complete game flow: Login > Menu > Ship Placement > Battle > Game Over
- Hunt/Target AI with checkerboard parity optimization
- Persistent player stats via AsyncStorage
- Military/naval dark aesthetic with haptic feedback
- Animations for hits, misses, and sunk events

### Out of Scope (Future Versions)

- Zero-Knowledge Proof integration
- PvP multiplayer (online)
- Blockchain/wallet integration
- Sound effects / music
- Difficulty levels
- Achievements system

## Game Rules

| Rule | Value |
|------|-------|
| Grid Size | 6x6 |
| Ships | 2x Patrol Boat (2 cells) + 1x Destroyer (3 cells) |
| Total Ship Cells | 7 (~19% board density) |
| Turn Order | Player fires, then AI fires |
| Win Condition | All opponent ships sunk |
| Adjacent Ships | Allowed |

## Cell States

| State | Description | Visual |
|-------|-------------|--------|
| Empty | Untouched cell | Dark transparent |
| Ship | Own ship (own board only) | Steel gray |
| Hit | Successful attack | Orange/fire with animation |
| Miss | Failed attack | Blue/gray with ripple |
| Sunk | All cells of a ship hit | Dark red with shake animation |

## Screen Flow

```
Login → Menu → Ship Placement → Battle → Game Over → Menu
                                                    ↘ Placement (replay)
```

All transitions use `router.replace()` to prevent back-navigation to mid-game states.

## Screens

### 1. Login (index.tsx)
- Username text input
- Naval-themed background with gradient
- "Enter Battle" button
- Persists username in AsyncStorage

### 2. Menu (menu.tsx)
- Welcome message with player name
- Player stats: Wins / Losses / Win Rate
- "Start Battle" button (navigates to placement)
- "PvP" button (disabled, "Coming Soon" badge)

### 3. Ship Placement (placement.tsx)
- 6x6 grid for own board
- Ship selector bar (shows remaining ships to place)
- Rotate button to toggle horizontal/vertical
- Ghost preview showing ship position before confirming
- Auto-place button for random placement
- "Ready" button (enabled when all ships placed)

### 4. Battle (battle.tsx)
- Two grids: opponent (top, tappable) + own (bottom, display only)
- Turn indicator: "Your Turn" / "Enemy Firing..."
- Fleet status showing remaining ships for both sides
- AI fires after variable delay (600-1200ms)
- Haptic feedback on every action

### 5. Game Over (gameover.tsx)
- Victory or Defeat display
- Match stats (shots fired, accuracy, ships lost)
- "Play Again" button → placement
- "Menu" button → menu

## Non-Functional Requirements

### Performance
- 60fps during animations
- Cell renders use React.memo to prevent unnecessary re-renders
- AI computation must not block UI thread

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

## Success Criteria

1. App loads without errors on iOS and Android
2. Complete game flow works end-to-end
3. AI provides reasonable challenge
4. Stats persist across app restarts
5. Animations and haptics provide satisfying feedback
6. No back-navigation to mid-game states
