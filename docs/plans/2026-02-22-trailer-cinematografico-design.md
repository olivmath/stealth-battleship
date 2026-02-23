# Trailer Cinematografico — Stealth Battleship

> Design doc para trailer de 2:30 para hackathon Stellar Hacks: ZK Gaming 2026
> Abordagem: Cinematic Narrative — footage naval + tech + demo + PiP rosto

---

## Decisoes de Design

| Aspecto | Decisao |
|---------|---------|
| Publico-alvo | Juizes do hackathon (tecnico + impactante) |
| Footage | Clips de filmes/docs navais (Midway, Greyhound, etc) |
| Editor | Remotion (tudo programatico) |
| Camera | PiP pequeno no canto, rosto em momentos-chave |
| Abordagem | Cinematic Narrative |
| Duracao | 2:30 (150s) @ 30fps = 4500 frames |
| Resolucao | 1920x1080 |

---

## Timeline de Cenas

```
CENA 1 — HOOK CINEMATICO          0:00 — 0:20  (20s / 600 frames)
CENA 2 — O PROBLEMA               0:20 — 0:35  (15s / 450 frames)
CENA 3 — AS 3 PROVAS              0:35 — 1:20  (45s / 1350 frames)
CENA 4 — DEMO DO JOGO             1:20 — 1:50  (30s / 900 frames)
CENA 5 — ARQUITETURA + STELLAR    1:50 — 2:10  (20s / 600 frames)
CENA 6 — ENCERRAMENTO             2:10 — 2:30  (20s / 600 frames)
```

---

## CENA 1 — HOOK CINEMATICO (0:00 — 0:20)

### Visual
- Footage de oceano escuro/tempestade em slow motion
- Navio de guerra cortando ondas
- Overlay: particulas de sonar/radar sobre o footage
- Texto aparece com glitch effect:
  - *"In war, information is power."* (pausa)
  - *"But what if you could prove... without revealing?"*
- Logo STEALTH BATTLESHIP emerge do fog com glow dourado

### Audio
- SFX: ondas + sonar ping
- Musica: ambient/tensa (tipo Hans Zimmer low drone)

### Camera
- Sem rosto. Pure footage + motion graphics.

### Footage sugerido
- Greyhound (2020) — destroyer no oceano
- Midway (2019) — aereas de frota
- Stock: oceano tempestuoso, sonar green screen

### Transicao
- Footage escurece, split screen emerge

---

## CENA 2 — O PROBLEMA (0:20 — 0:35)

### Visual
- Split screen animado:
  - **Esquerda:** "Traditional Battleship" — servidor com olho vendo 2 boards (vermelho/danger)
  - **Direita:** "ZK Battleship" — cadeado, boards com "?" (verde/seguro)
- Transicao: lado esquerdo "explode" como hit, lado direito permanece intacto

### Camera
- PiP no canto inferior-direito

### Narracao
*"In regular digital Battleship, someone always sees both boards. A server, a smart contract, or an end-game reveal. With ZK proofs — no one ever sees your board."*

### Transicao
- Slide para timeline dos circuitos

---

## CENA 3 — AS 3 PROVAS (0:35 — 1:20)

Dividida em 3 blocos de 15s:

### 3A — board_validity (0:35 — 0:50)

**Visual:**
- Footage: tripulacao preparando navio para batalha
- Corta pra: animacao do grid 6x6 com navios aparecendo
- Hash visual: numeros fluindo tipo Matrix → converge pra hash Poseidon
- Texto overlay: "PROOF 1: Board Validity"
- Badge animado: `Private: positions | Public: hash only`

**Narracao (PiP rosto):**
*"When you place your ships, a ZK proof guarantees your board is valid — correct sizes, no overlaps — without revealing where anything is."*

### 3B — shot_proof (0:50 — 1:05)

**Visual:**
- Footage: explosao naval / torpedo hitting ship
- Corta pra: crosshair numa celula do grid → resultado HIT com fogo
- Texto overlay: "PROOF 2: Shot Proof"
- Badge: `Generated every turn | ~1-2s`

**Narracao (PiP rosto):**
*"Every hit or miss is backed by a proof. The result matches your committed board. Lying is mathematically impossible."*

### 3C — turns_proof (1:05 — 1:20)

**Visual:**
- Footage: navio afundando em slow motion (dramatico)
- Corta pra: replay visual de todos os tiros no grid + trofeu emerge
- Texto overlay: "PROOF 3: Turns Proof"
- Badge: `Settles on-chain | The circuit IS the referee`

**Narracao (PiP rosto):**
*"At game end, the entire sequence is replayed inside a circuit. The winner is computed in the proof itself."*

---

## CENA 4 — DEMO DO JOGO (1:20 — 1:50)

### Visual
- Screen recording real do app (iOS simulator ou device)
- Overlay labels semi-transparentes:

| Tempo | Acao | Label |
|-------|------|-------|
| 1:20 | Ship placement | "Ship Placement — drag & drop" |
| 1:25 | Tap Ready → loading | "board_validity proof generating (NoirJS/WASM)" |
| 1:30 | "Deploying to blockchain..." | "Soroban TX 1: open_match()" |
| 1:35 | Battle — tap celula | "Player attacks → opponent generates shot_proof" |
| 1:40 | HIT! com fogo | "Proof verified — result is honest" |
| 1:45 | Game over — Victory | "turns_proof → Soroban TX 2: close_match()" |

### Camera
- PiP rosto narrando guia da demo

### Audio
- SFX do jogo + musica mais leve

---

## CENA 5 — ARQUITETURA + STELLAR (1:50 — 2:10)

### Visual
- Diagrama animado em 3 camadas:
  - PLAYER DEVICE (Noir WASM + Game Engine)
  - STELLAR/Soroban (TX1: open, TX2: close, escrow)
  - CONVEX (matchmaking, turns, shot verify)
- Linhas conectoras animam mostrando data flow
- Highlight pulsante: "Protocol 25 — BN254 + Poseidon2"
- Badge: "Only 2 on-chain transactions per game"

### Cores dos blocos
- Stellar: azul (#2845a0)
- Convex: roxo
- Device: escuro com glow

### Camera
- PiP rosto

### Narracao
*"The architecture is hybrid. Two Soroban transactions per game — open and close. Real-time turns handled by Convex. We chose Stellar because Protocol 25 gives us native BN254 and Poseidon2 — the exact primitives our circuits use."*

---

## CENA 6 — ENCERRAMENTO (2:10 — 2:30)

### Visual
- Footage: frota naval ao por-do-sol (epico, wide shot)
- Fade pra fundo navy (#0a1628)
- Logo STEALTH BATTLESHIP grande centralizado
- Tagline typewriter: *"Fair by math. Fun by design."*
- Links fade-in:
  ```
  github.com/olivmath/battleship-zk
  Stellar Testnet | Noir + UltraHonk
  ```
- Logos: Stellar + Noir + Convex alinhados na base
- Background: radar sweep animation sutil

### Audio
- Musica sobe e resolve
- SFX: sonar ping final

---

## Audio & Musica

### Trilha Sonora
- **Estilo:** Cinematic ambient/tension → resolve no final
- **Referencia:** Hans Zimmer (Dunkirk/Interstellar vibes), low drone + building tension
- **Sugestoes:** Artlist.io ou Epidemic Sound (royalty-free cinematic)

### SFX
| Momento | SFX |
|---------|-----|
| Intro | Ondas, sonar ping, vento |
| Problema | Alerta/sirene sutil, "danger" |
| Board validity | Hash computing (digital), grid snap |
| Shot proof | Explosao, torpedo splash |
| Turns proof | Navio afundando, metal stress |
| Demo | Sons do jogo |
| Encerramento | Sonar ping final, musica resolve |

---

## Assets Necessarios

### Footage Naval (clips de filmes)
- [ ] Oceano escuro / tempestade (intro)
- [ ] Navio de guerra cortando ondas (intro)
- [ ] Tripulacao preparando para batalha (board_validity)
- [ ] Explosao naval / torpedo (shot_proof)
- [ ] Navio afundando slow motion (turns_proof)
- [ ] Frota ao por-do-sol (encerramento)

### Gravacoes Proprias
- [ ] Rosto PiP — narracoes para cenas 2, 3A, 3B, 3C, 4, 5
- [ ] Screen recording do app (demo gameplay)

### Motion Graphics (Remotion)
- [ ] Particulas sonar/radar overlay
- [ ] Logo STEALTH BATTLESHIP com glow animation
- [ ] Split screen problema (server vs ZK)
- [ ] Cards dos 3 circuitos com badges
- [ ] Grid 6x6 animado com hash visual
- [ ] Crosshair + HIT animation
- [ ] Diagrama de arquitetura animado
- [ ] Checklist / badges animados
- [ ] Typewriter text effect
- [ ] Radar sweep background

### Fontes
- Orbitron Bold (titulos)
- Rajdhani SemiBold (body)
- JetBrains Mono (code)

### Paleta de Cores
| Cor | Hex | Uso |
|-----|-----|-----|
| Navy Dark | #0a1628 | Background |
| Navy Mid | #1a2a4a | Cards, boxes |
| Gold | #c9a634 | Highlights, borders |
| Fire Orange | #ff6b35 | Hits, enfase |
| Teal | #00d4aa | ZK/proof elements |
| White | #e8e8e8 | Texto |
| Red Alert | #ff3a3a | Danger/problema |
| Green Safe | #4ade80 | Seguro/ZK |

---

## Roteiro de Narracao Completo

### [0:00 — 0:20] HOOK (voiceover, sem rosto)
*"In war, information is power. But what if you could prove your strategy... without revealing it?"*

*(texto na tela, nao falado)*
*"This is Stealth Battleship."*

### [0:20 — 0:35] PROBLEMA (PiP rosto)
*"In regular digital Battleship, someone always sees both boards. A server, a smart contract, or an end-game reveal. With ZK proofs — no one ever sees your board."*

### [0:35 — 0:50] PROOF 1 (PiP rosto)
*"When you place your ships, a ZK proof guarantees your board is valid — correct sizes, no overlaps — without revealing where anything is."*

### [0:50 — 1:05] PROOF 2 (PiP rosto)
*"Every hit or miss is backed by a proof. The result matches your committed board. Lying is mathematically impossible."*

### [1:05 — 1:20] PROOF 3 (PiP rosto)
*"At game end, the entire sequence is replayed inside a circuit. The winner is computed in the proof itself."*

### [1:20 — 1:50] DEMO (PiP rosto)
*"Let me show you. Place ships on the grid... tap Ready... the board validity proof generates client-side... committed on Stellar... Battle begins — each shot is proven... and when it ends, the turns proof settles everything on-chain. Two transactions total."*

### [1:50 — 2:10] ARQUITETURA (PiP rosto)
*"The architecture is hybrid. Two Soroban transactions per game. Real-time turns on Convex. We chose Stellar because Protocol 25 gives us native BN254 and Poseidon2 — the exact primitives our circuits use."*

### [2:10 — 2:30] ENCERRAMENTO (voiceover, sem rosto)
*"Stealth Battleship. Fair by math. Fun by design."*

---

## Remotion: Estrutura de Componentes

```
src/
  TrailerVideo.tsx          (composicao principal)
  scenes/
    HookCinematic.tsx       (cena 1 - footage + text + logo)
    ProblemSplit.tsx         (cena 2 - split screen)
    ProofBoard.tsx           (cena 3A - board_validity)
    ProofShot.tsx            (cena 3B - shot_proof)
    ProofTurns.tsx           (cena 3C - turns_proof)
    GameDemo.tsx             (cena 4 - screen recording + overlays)
    ArchitectureDiagram.tsx  (cena 5 - diagrama animado)
    ClosingEpic.tsx          (cena 6 - logo + tagline)
  components/
    PiPWebcam.tsx            (picture-in-picture overlay)
    SonarParticles.tsx       (particle effect sonar)
    GlitchText.tsx           (texto com glitch effect)
    TypewriterText.tsx       (efeito maquina de escrever)
    RadarSweep.tsx           (background radar animation)
    HashVisualization.tsx    (numeros fluindo → hash)
    CircuitBadge.tsx         (badge animado Private/Public)
    OverlayLabel.tsx         (label semi-transparente)
  styles/
    theme.ts                 (cores, fontes, constantes)
```

---

## Status: DESIGN EM PROGRESSO

- [x] Decisoes de design
- [x] Timeline de cenas
- [x] Roteiro de narracao
- [ ] Detalhamento audio/SFX (pendente)
- [ ] Storyboard visual por cena (pendente)
- [ ] Implementacao Remotion (pendente)
