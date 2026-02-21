# Roteiro de Cenas — Video Demo Battleship ZK

> Descrição visual frame-by-frame de cada cena do video.
> Use como referência para gravar e/ou montar no Remotion.

---

## CENA 1 — INTRO (0:00 — 0:15) | 15s

### Visual
- Fundo escuro navy (#0a1628) com grid sutil animado (linhas de radar)
- Logo "BATTLESHIP ZK" em fonte Orbitron, scale-in com glow dourado
- Tagline aparece abaixo: "Trustless Naval Warfare on Stellar"
- Particle effect sutil (pontos flutuantes como sonar)
- Logo Stellar + Logo Noir pequenos no canto inferior

### Transição
- Fade to dark

---

## CENA 2 — O PROBLEMA (0:15 — 0:35) | 20s

### Visual
- Diagrama split-screen:
  - **Esquerda:** "Traditional Battleship" — ícone de servidor no centro vendo 2 boards transparentes (ambos visíveis). Label: "Server sees everything"
  - **Direita:** "Battleship ZK" — ícone de cadeado no centro, 2 boards com "?" opaco. Label: "Zero knowledge"
- Animação: o lado esquerdo fica vermelho/danger, o direito fica verde/seguro
- Ícones simples: eye (olho) no server, lock (cadeado) no ZK

### Assets necessários
- Ícone servidor
- Ícone cadeado/shield
- Mini-boards estilizados (6x6 grid)

### Transição
- Slide left para próxima cena

---

## CENA 3 — OS 3 CIRCUITOS (0:35 — 1:05) | 30s

### Visual
- Timeline horizontal com 3 cards animados aparecendo em sequência:

**Card 1 — board_validity (aparece em 0:35)**
- Ícone: grid com navios + hash icon
- Title: "Board Validity"
- Subtitle: "Prove your board is legal"
- Mini-lista: "Valid sizes | No overlaps | Within bounds"
- Arrow animada: "ships + nonce → Poseidon → board_hash"
- Badge: "Private: ship positions | Public: hash only"

**Card 2 — shot_proof (aparece em 0:45)**
- Ícone: crosshair + checkmark
- Title: "Shot Proof"
- Subtitle: "Prove every hit/miss is honest"
- Mini-lista: "board_hash matches | result matches cell"
- Badge: "Generated per turn (~1-2s)"

**Card 3 — turns_proof (aparece em 0:55)**
- Ícone: replay icon + trophy
- Title: "Turns Proof"
- Subtitle: "Prove the entire game was fair"
- Mini-lista: "Full replay | Compute winner in-circuit"
- Badge: "Settles on-chain"

### Fundo
- Dark com linhas de código Noir blur no background

### Transição
- Cards shrink para corner, gameplay toma tela

---

## CENA 4 — DEMO GAMEPLAY (1:05 — 1:30) | 25s

### Visual
- **Screen recording real do app** rodando no simulador/device
- Overlay translúcido no topo com labels explicando cada momento:

**Sequência de capturas:**

1. **(1:05)** Tela de placement — arrastar navios no grid 6x6
   - Label overlay: "Ship Placement — drag & drop"

2. **(1:10)** Tap "Ready" → loading "Securing your fleet..."
   - Label overlay: "board_validity proof generating (NoirJS/WASM)"
   - Mostrar RadarSpinner

3. **(1:15)** Loading "Deploying to blockchain..."
   - Label overlay: "Soroban TX 1: open_match()"
   - Mostrar hash da TX aparecendo

4. **(1:18)** Battle screen — tap numa célula
   - Label overlay: "Player attacks → opponent generates shot_proof"

5. **(1:22)** Resultado: HIT! com animação de fogo
   - Label overlay: "Proof verified — result is honest"

6. **(1:25)** Game over — "Victory!" + settlement
   - Label overlay: "turns_proof → Soroban TX 2: close_match()"

### Assets necessários
- Screen recording do app (iOS simulator ou device)
- Overlay labels (semi-transparent dark boxes com texto branco)

### Transição
- Zoom out do phone para diagrama de arquitetura

---

## CENA 5 — ARQUITETURA (1:30 — 2:00) | 30s

### Visual
- Diagrama animado em 3 camadas:

```
┌─────────────────────────────────┐
│         PLAYER DEVICE           │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Noir     │  │ Game Engine  │ │
│  │ Circuits │  │ (TypeScript) │ │
│  │ (WASM)   │  │              │ │
│  └────┬─────┘  └──────┬───────┘ │
└───────┼───────────────┼─────────┘
        │               │
   proofs          real-time turns
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│   STELLAR    │  │   CONVEX     │
│   (Soroban)  │  │  (off-chain) │
│              │  │              │
│ TX1: open    │  │ matchmaking  │
│ TX2: close   │  │ turns        │
│ escrow       │  │ shot verify  │
└──────────────┘  └──────────────┘
```

- Cada camada aparece com animação slide-up
- Linhas conectoras animam mostrando data flow
- Highlight pulsante em "Protocol 25 — BN254 + Poseidon2" no bloco Stellar
- Badge: "Only 2 on-chain transactions per game"

### Detalhes visuais
- Bloco Stellar: cor azul (#2845a0) com logo Stellar
- Bloco Convex: cor roxa
- Bloco Device: cor escura com glow
- Animação: setas pulsam mostrando fluxo bidirecional

### Transição
- Fade para checklist

---

## CENA 6 — DIFERENCIAIS (2:00 — 2:20) | 20s

### Visual
- Lista de checkmarks aparecendo um por um com animação satisfying:

```
✓ ZK is the game, not a feature
✓ 3 specialized Noir circuits
✓ Prove-as-you-go (no commit-reveal)
✓ Stellar Protocol 25 native primitives
✓ Production-quality mobile game
✓ Real-time gameplay + on-chain settlement
```

- Cada item aparece com som de "ping" sutil
- Checkmarks dourados em fundo navy
- Fonte: Orbitron para titles, Rajdhani para body (match game fonts)

### Transição
- Todos os checks fazem zoom-in e viram o logo

---

## CENA 7 — ENCERRAMENTO (2:20 — 2:40) | 20s

### Visual
- Logo "BATTLESHIP ZK" grande no centro
- Tagline: **"Fair by math. Fun by design."** aparece com typewriter effect
- Links abaixo (fade-in):
  ```
  github.com/olivmath/battleship-zk
  Stellar Testnet | Noir + UltraHonk
  ```
- Logo Stellar + Noir + Convex alinhados na base
- Background: radar sweep animation sutil
- Texto final: "Built for Stellar Hacks: ZK Gaming 2026"

### Áudio
- Último segundo: fade-out suave

---

## Resumo Técnico de Produção

| Cena | Duração | Tipo | Assets |
|------|---------|------|--------|
| 1. Intro | 15s | Motion graphics | Logo, fonts, particles |
| 2. Problema | 20s | Diagrama animado | Ícones server/lock, mini-boards |
| 3. Circuitos | 30s | Cards animados | 3 cards com ícones |
| 4. Gameplay | 25s | Screen recording + overlay | Gravação real do app |
| 5. Arquitetura | 30s | Diagrama animado | Blocos + setas + logos |
| 6. Diferenciais | 20s | Checklist animado | Checkmarks |
| 7. Encerramento | 20s | Logo + links | Logo, links, logos parceiros |
| **TOTAL** | **2:40** | | |

## Paleta de Cores (match game aesthetic)

| Cor | Hex | Uso |
|-----|-----|-----|
| Navy Dark | `#0a1628` | Background principal |
| Navy Mid | `#1a2a4a` | Cards, boxes |
| Gold | `#c9a634` | Highlights, borders, checkmarks |
| Fire Orange | `#ff6b35` | Hits, ênfase |
| Teal | `#00d4aa` | ZK/proof elements |
| White | `#e8e8e8` | Texto principal |
| Red Alert | `#ff3a3a` | Danger/problema |
| Green Safe | `#4ade80` | Seguro/ZK |

## Fontes

- **Títulos:** Orbitron Bold
- **Body:** Rajdhani SemiBold
- **Code:** JetBrains Mono
