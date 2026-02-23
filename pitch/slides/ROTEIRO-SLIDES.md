# Roteiro de Slides — Battleship ZK

> Conteúdo de cada slide para a apresentação Spectacle.
> Estilo: dark naval, Orbitron + Rajdhani, navy/gold/teal.

---

## SLIDE 1 — COVER

```
BATTLESHIP ZK
━━━━━━━━━━━━━

Trustless Naval Warfare on Stellar

[Logo Stellar]  [Logo Noir]

Stellar Hacks: ZK Gaming 2026
olivmath
```

**Design:** Logo grande centralizado, tagline abaixo, fundo navy com grid radar sutil.

---

## SLIDE 2 — THE PROBLEM

```
THE TRUST PROBLEM
━━━━━━━━━━━━━━━━

In digital Battleship, someone always sees both boards.

┌──────────┐         ┌──────────┐
│ Player A │ ←─ 👁 ─→ │ Player B │
│  board   │ SERVER  │  board   │
└──────────┘         └──────────┘

Server can cheat.
Commit-reveal? Loser disconnects.
On-chain boards? Mempool front-running.

"Trust me" is not a game mechanic.
```

**Design:** Split com "server vê tudo" vs "ZK: ninguém vê". Vermelho (inseguro) vs Verde (seguro).

---

## SLIDE 3 — THE SOLUTION

```
PROVE-AS-YOU-GO
━━━━━━━━━━━━━━━

No board reveal. No commit-reveal.
Every action generates a ZK proof in real-time.

┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│ PLACE SHIPS    │   │ RECEIVE SHOT   │   │ GAME ENDS      │
│                │   │                │   │                │
│ board_validity │   │ shot_proof     │   │ turns_proof    │
│                │   │                │   │                │
│ "Board is      │   │ "Hit/miss is   │   │ "Winner is     │
│  valid"        │   │  honest"       │   │  proven"       │
└────────────────┘   └────────────────┘   └────────────────┘

Private inputs NEVER leave your device.
```

**Design:** 3 cards horizontais com ícones, animação sequencial.

---

## SLIDE 4 — CIRCUIT: board_validity

```
CIRCUIT 1: board_validity
━━━━━━━━━━━━━━━━━━━━━━━━

🔒 Private:  board[6][6], nonce
🌐 Public:   board_hash, ship_count, ship_sizes

Constraints:
  ✓ board_hash == Poseidon(board, nonce)
  ✓ Each ship has correct size
  ✓ Ships don't overlap
  ✓ All ships within grid bounds

Generated once at placement (~2-5s)
Verified on-chain (Soroban UltraHonk)
```

**Design:** Code-style layout com fundo escuro, syntax highlighting para Private/Public.

---

## SLIDE 5 — CIRCUIT: shot_proof

```
CIRCUIT 2: shot_proof
━━━━━━━━━━━━━━━━━━━━

🔒 Private:  board[6][6], nonce
🌐 Public:   board_hash, row, col, is_hit

Constraints:
  ✓ board_hash matches committed hash
  ✓ is_hit == (board[row][col] == 1)

Generated every turn (~1-2s)
Verified off-chain (Express + Socket.io) for real-time play

Lying is mathematically impossible.
```

**Design:** Similar ao slide 4, com highlight em "mathematically impossible".

---

## SLIDE 6 — CIRCUIT: turns_proof

```
CIRCUIT 3: turns_proof
━━━━━━━━━━━━━━━━━━━━━

🔒 Private:  both boards, both nonces
🌐 Public:   both hashes, all attacks, winner

Constraints:
  ✓ Both board hashes match
  ✓ Every attack result replayed correctly
  ✓ Winner computed INSIDE the circuit

Generated at game end
Settled on-chain → BATTLE token clawback to winner

The circuit IS the referee.
```

**Design:** Similar aos anteriores, com emphasis no "circuit IS the referee".

---

## SLIDE 7 — ARCHITECTURE

```
ARCHITECTURE — Hybrid On-Chain / Off-Chain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────┐
│         PLAYER DEVICE           │
│    Noir Circuits (WASM)         │
│    Game Engine (TypeScript)     │
└──────────┬──────────┬───────────┘
           │          │
      proofs    real-time turns
           │          │
     ┌─────▼──┐  ┌────▼────────────────────┐
     │STELLAR │  │ BACKEND                 │
     │Soroban │  │ Express + Socket.io     │
     │        │  │ (real-time PvP)         │
     │TX1:pay │  │ Supabase (persistence)  │
     │TX2:open│  │ matchmaking             │
     │TX3:end │  │ shot verification       │
     └────────┘  └─────────────────────────┘

3 blockchain moments per game:
  TX1 Payment: XLM + BATTLE token
  TX2 Start:   board proofs anchored
  TX3 End:     turns_proof anchored
```

**Design:** Diagrama com blocos coloridos (Stellar=azul, Backend=roxo, Device=escuro).

---

## SLIDE 8 — STELLAR NATIVE

```
WHY STELLAR
━━━━━━━━━━━

Protocol 25 (X-Ray):
  → Native BN254 elliptic curve operations
  → Native Poseidon2 hash function
  = The EXACT primitives our Noir circuits use

┌────────────────────────────────────────┐
│  Noir Circuit    →  Poseidon2 hash     │
│  UltraHonk proof →  BN254 verify      │
│  Soroban contract →  Native, efficient │
└────────────────────────────────────────┘

Not just "deployed on Stellar"
— DESIGNED for Stellar's primitives.

Game Hub: start_game() + end_game()
Contract: CB4VZAT2...EMYG
```

**Design:** Logo Stellar grande, highlight nos primitivos criptográficos.

---

## SLIDE 9 — TECH STACK

```
TECH STACK
━━━━━━━━━━

ZK Framework    Noir (Aztec)
Proof System    UltraHonk
Hashing         Poseidon2
Proof Gen       NoirJS + bb.js (client WASM)
Contracts       Soroban (Rust)
Real-time       Express + Socket.io
Persistence     Supabase
Frontend        React Native / Expo
Languages       TypeScript, Rust, Noir
```

**Design:** Tabela clean com ícones para cada tech.

---

## SLIDE 10 — GAME DEMO

```
GAMEPLAY FLOW
━━━━━━━━━━━━━

ARCADE (local, no backend):
1. Place ships    → drag & drop on grid
2. ZK commitment  → "Securing your fleet..." (2-5s)
3. Battle         → tap to attack, fully local ZK
4. Game over      → turns_proof computed locally

PVP:
1. Payment        → XLM + BATTLE token — TX 1
2. BATTLE token   → issued, matchmaking begins
3. Placement      → board_validity proof verified server-side
4. On-chain       → board proofs anchored — TX 2
5. Battle         → shot proofs verified synchronously; invalid = lose
6. Reveal         → game over, turns_proof generated
7. On-chain       → turns_proof anchored — TX 3
8. Settlement     → BATTLE token clawback to winner

[Screenshot / GIF do app aqui]
```

**Design:** Timeline vertical com duas colunas (Arcade / PvP), screenshots do app ao lado.

---

## SLIDE 11 — WHAT'S BUILT

```
PROJECT STATUS
━━━━━━━━━━━━━━

✅ 3+1 Noir circuits (board, shot, turns, hash_helper)
✅ Full mobile game (AI + Arcade mode, animations, haptics)
✅ Match history + ranking system (6 ranks)
✅ i18n (English, Portuguese, Spanish)
✅ Settings (grid size, battle view mode)
✅ PvP screens + payment flow (UI complete)
🔧 ZK Service (WebView proof generation) — in progress
🔧 Express + Socket.io backend (PvP real-time) — in progress
🔧 Supabase integration (persistence) — in progress
🔧 Soroban contract + Game Hub — in progress
🔧 Web client for judges — in progress
```

**Design:** Checklist com status colors (verde=done, amarelo=in progress).

---

## SLIDE 12 — WHY WE SHOULD WIN

```
WHY THIS SHOULD WIN
━━━━━━━━━━━━━━━━━━━

1. ZK IS the game — remove it and nothing works
2. Hardest ZK gaming problem — per-turn proofs,
   committed state, interactive verification
3. 3 specialized circuits (most projects use 1)
4. Production-quality game, not a POC
5. Stellar-native design using P25 primitives
6. Prove-as-you-go > commit-reveal

"Fair by math. Fun by design."
```

**Design:** Números grandes dourados, texto branco, fundo navy.

---

## SLIDE 13 — CLOSING

```
BATTLESHIP ZK
━━━━━━━━━━━━━

"Fair by math. Fun by design."

github.com/olivmath/battleship-zk

         [Stellar]  [Noir]  [Supabase]

                  olivmath
       Stellar Hacks: ZK Gaming 2026
```

**Design:** Logo centralizado, links, logos parceiros na base. Fundo com radar sweep animation.

---

## Resumo

| # | Slide | Tempo sugerido |
|---|-------|---------------|
| 1 | Cover | — |
| 2 | The Problem | 20s |
| 3 | The Solution (Prove-as-you-go) | 20s |
| 4 | Circuit: board_validity | 15s |
| 5 | Circuit: shot_proof | 15s |
| 6 | Circuit: turns_proof | 15s |
| 7 | Architecture | 20s |
| 8 | Why Stellar | 20s |
| 9 | Tech Stack | 10s |
| 10 | Game Demo | 20s |
| 11 | What's Built | 15s |
| 12 | Why We Should Win | 20s |
| 13 | Closing | 10s |
| **Total** | **13 slides** | **~3:20** |
