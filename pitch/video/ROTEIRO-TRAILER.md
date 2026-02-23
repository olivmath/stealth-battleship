# ROTEIRO — Trailer Cinematografico Battleship ZK

> **Formato:** Trailer para hackathon | **Duracao:** 2:30 | **Idioma:** Ingles
> **Estilo:** Cinematic narrative — footage naval + ZK tech + demo do jogo
> **Camera:** PiP (picture-in-picture) no canto inferior-direito em cenas narradas
> **Resolucao:** 1920x1080 @ 30fps

---

## CENA 1 — HOOK CINEMATICO
**Tempo:** 0:00 — 0:20 (20s)
**Camera:** Sem rosto. Voiceover puro.

---

### TELA

```
[0:00 — 0:03]  TELA PRETA. Silencio.
               SFX: onda distante, grave. Sonar ping unico.

[0:03 — 0:08]  FOOTAGE: Oceano escuro, nublado, visto de cima.
               Camera lenta. Navio de guerra emerge da neblina.
               OVERLAY: particulas verdes de sonar pulsando sobre a agua.
               MUSICA: drone grave comeca (estilo Dunkirk).

[0:08 — 0:13]  FOOTAGE: Close no casco do navio cortando ondas.
               TEXTO (glitch-in, Orbitron Bold, dourado):

                    "In war, information is power."

               Texto treme levemente, como sinal de radar instavel.

[0:13 — 0:17]  FOOTAGE: Silhueta de frota no horizonte. Contra-luz.
               TEXTO anterior some. Novo texto (glitch-in):

                    "But what if you could prove...
                     without revealing?"

[0:17 — 0:20]  FOOTAGE escurece gradualmente.
               LOGO "BATTLESHIP ZK" emerge do centro com glow dourado.
               Abaixo do logo: "Trustless Naval Warfare on Stellar"
               SFX: sonar ping duplo. Musica sustenta.
```

### NARRACAO (voiceover)

> *"In war... information is power."*
> *(pausa 2s)*
> *"But what if you could prove your strategy... without revealing it?"*

### TRANSICAO
Tela escurece. Logo permanece 1s, depois faz fade. Split screen emerge.

---

## CENA 2 — O PROBLEMA
**Tempo:** 0:20 — 0:35 (15s)
**Camera:** PiP rosto no canto inferior-direito (aparece em 0:22).

---

### TELA

```
[0:20 — 0:22]  Split screen aparece com slide horizontal:

               ┌─────────────────────┬─────────────────────┐
               │  TRADITIONAL        │  BATTLESHIP ZK      │
               │  BATTLESHIP         │                     │
               │                     │                     │
               │   👁 SERVER 👁       │     🔒 ZK 🔒        │
               │                     │                     │
               │  ┌─────┐  ┌─────┐  │  ┌─────┐  ┌─────┐  │
               │  │BOARD │  │BOARD │  │  │ ??? │  │ ??? │  │
               │  │ A    │  │ B   │  │  │     │  │     │  │
               │  └─────┘  └─────┘  │  └─────┘  └─────┘  │
               │                     │                     │
               │  "Server sees       │  "No one sees       │
               │   everything"       │   your board"       │
               └─────────────────────┴─────────────────────┘

               Lado esquerdo: borda VERMELHA (#ff3a3a), pulsando.
               Lado direito: borda VERDE (#4ade80), solida.

[0:22]         PiP do rosto aparece (slide-in do canto).

[0:28 — 0:30]  Lado esquerdo EXPLODE (efeito de hit/fogo).
               Fragmentos se desintegram.
               Lado direito permanece intacto, glow verde intensifica.

[0:30 — 0:35]  Lado direito expande pra tela cheia.
               Texto centralizado:

                    "Zero Knowledge. Full Privacy."

               Cor teal (#00d4aa).
```

### NARRACAO (PiP rosto)

> *"In regular digital Battleship, someone always sees both boards — a server, a smart contract, or an end-game reveal."*
> *(lado esquerdo explode)*
> *"With ZK proofs — no one ever sees your board."*

### TRANSICAO
Tela verde faz slide-left. Fundo navy limpo. Titulo "3 PROOFS" aparece.

---

## CENA 3A — PROOF 1: BOARD VALIDITY
**Tempo:** 0:35 — 0:50 (15s)
**Camera:** PiP rosto no canto inferior-direito.

---

### TELA

```
[0:35 — 0:37]  TEXTO (Orbitron, teal, scale-in):

                    "PROOF 1"
                    "Board Validity"

               Subtitulo (Rajdhani): "Prove your board is legal"

[0:37 — 0:40]  FOOTAGE (fundo, 40% opacidade): tripulacao posicionando
               equipamentos num navio de guerra. Preparacao pra batalha.

               SOBRE O FOOTAGE: grid 6x6 aparece no centro.
               Navios surgem um a um com snap animation (scale + glow).
               - Patrol Boat (2 celulas) — snap
               - Patrol Boat (2 celulas) — snap
               - Destroyer (3 celulas) — snap

[0:40 — 0:45]  Grid com navios posicionados.
               ANIMACAO HASH: numeros hexadecimais fluem dos navios
               como particulas → convergem pro centro →
               resultado: "0x7a3f...b2c1" (hash Poseidon)

               TEXTO aparece ao lado:
               ┌──────────────────────────────────┐
               │ 🔒 Private: ship positions       │
               │ 🌐 Public: board_hash only        │
               └──────────────────────────────────┘

[0:45 — 0:50]  Grid se miniaturiza pro canto.
               BADGE aparece (slide-in):
               "Verified on-chain via Soroban UltraHonk"
               SFX: lock click.
```

### NARRACAO (PiP rosto)

> *"When you place your ships, a ZK proof guarantees your board is valid — correct sizes, no overlaps, within bounds — without revealing where anything is. The board is Poseidon-hashed and committed on-chain."*

### TRANSICAO
Grid miniatura desliza pra esquerda. Crosshair aparece na direita.

---

## CENA 3B — PROOF 2: SHOT PROOF
**Tempo:** 0:50 — 1:05 (15s)
**Camera:** PiP rosto no canto inferior-direito.

---

### TELA

```
[0:50 — 0:52]  TEXTO (Orbitron, teal, scale-in):

                    "PROOF 2"
                    "Shot Proof"

               Subtitulo: "Prove every hit/miss is honest"

[0:52 — 0:56]  Grid 6x6 no centro da tela.
               CROSSHAIR animado move pra celula [3,4].
               SFX: targeting beep.
               Crosshair trava na celula. Flash.

[0:56 — 0:58]  CORTE RAPIDO → FOOTAGE: explosao naval.
               Torpedo atinge casco. Agua explode. Camera shake.
               Duracao: 2s (impacto rapido).
               SFX: explosao + metal.

[0:58 — 1:02]  VOLTA pro grid.
               Celula [3,4] acende LARANJA (#ff6b35).
               Texto grande: "HIT!" com glow de fogo.
               Abaixo: formula animada (typewriter):

                    is_hit == (board[3][4] == 1) ✓

               BADGE: "board_hash matches committed hash ✓"

[1:02 — 1:05]  TEXTO destaque (Orbitron, branco):

                    "Lying is mathematically impossible."

               Badge: "Generated every turn | ~1-2s"
```

### NARRACAO (PiP rosto)

> *"Every time you receive a shot, a proof confirms whether it's a hit or miss — verified against your committed board hash."*
> *(explosao)*
> *"Lying is mathematically impossible."*

### TRANSICAO
Grid com hits faz fade. Footage de navio afundando emerge.

---

## CENA 3C — PROOF 3: TURNS PROOF
**Tempo:** 1:05 — 1:20 (15s)
**Camera:** PiP rosto no canto inferior-direito.

---

### TELA

```
[1:05 — 1:07]  TEXTO (Orbitron, teal, scale-in):

                    "PROOF 3"
                    "Turns Proof"

               Subtitulo: "Prove the entire game was fair"

[1:07 — 1:11]  FOOTAGE (fundo, 50% opacidade): navio afundando
               em slow motion. Dramatico. Agua engolindo o casco.
               SFX: metal stress, agua, grave.

               SOBRE O FOOTAGE: dois grids lado a lado (Player A | Player B).
               REPLAY ANIMADO: tiros aparecem um a um em sequencia
               rapida nos dois grids. Vermelho = hit. Azul = miss.
               Tipo fast-forward de uma partida inteira (~3s de animacao).

[1:11 — 1:15]  Replay congela. Linha se desenha conectando todos os tiros.
               TEXTO: "Full game replay — verified inside the circuit"

               TROFEU dourado emerge no centro entre os dois grids.
               Glow. SFX: achievement sound.

               Abaixo: "Winner computed IN the proof"

[1:15 — 1:20]  BADGE grande (destaque final):

               ┌───────────────────────────────────────┐
               │  "The circuit IS the referee."              │
               │   Settles on-chain → BATTLE token clawback  │
               └───────────────────────────────────────┘

               Footage de navio afundando continua no fundo.
```

### NARRACAO (PiP rosto)

> *"At game end, the entire sequence is replayed inside a circuit. The winner is computed in the proof itself. The circuit is the referee."*

### TRANSICAO
Grids e footage fazem fade to dark. Texto: "Let me show you." Corta pra demo.

---

## CENA 4 — DEMO DO JOGO
**Tempo:** 1:20 — 1:50 (30s)
**Camera:** PiP rosto no canto inferior-direito.

---

### TELA

```
[1:20 — 1:22]  TELA PRETA.
               TEXTO (Orbitron, dourado, typewriter):
                    "Let me show you."
               SFX: sonar ping.

[1:22 — 1:27]  SCREEN RECORDING: tela de placement do app.
               Jogador arrasta navios pro grid 6x6.
               OVERLAY LABEL (canto superior, fundo semi-transparente):
               ┌──────────────────────────────────┐
               │ 📍 Ship Placement — drag & drop  │
               └──────────────────────────────────┘

[1:27 — 1:31]  SCREEN RECORDING: tap no botao "Ready".
               Loading: "Securing your fleet..." com RadarSpinner.
               OVERLAY LABEL:
               ┌────────────────────────────────────────────┐
               │ 🔒 board_validity proof generating          │
               │    NoirJS + bb.js (client-side WASM)        │
               └────────────────────────────────────────────┘

[1:31 — 1:34]  SCREEN RECORDING: "Deploying to blockchain..."
               OVERLAY LABEL:
               ┌──────────────────────────────────────────────┐
               │ ⛓️  Soroban TX 2: board proofs anchored       │
               │    on Stellar — match started                 │
               └──────────────────────────────────────────────┘

[1:34 — 1:39]  SCREEN RECORDING: tela de batalha.
               Jogador toca numa celula pra atacar.
               OVERLAY LABEL:
               ┌──────────────────────────────────────────────┐
               │ 🎯 Player attacks → opponent proves response  │
               └──────────────────────────────────────────────┘

[1:39 — 1:43]  SCREEN RECORDING: resultado HIT! com animacao de fogo.
               OVERLAY LABEL:
               ┌────────────────────────────────────────┐
               │ ✅ shot_proof verified — result honest  │
               └────────────────────────────────────────┘

[1:43 — 1:48]  SCREEN RECORDING: tela de game over — "Victory!"
               XP earned + rank display.
               OVERLAY LABEL:
               ┌──────────────────────────────────────────────┐
               │ 🏆 turns_proof → Soroban TX 3: winner settled │
               │    BATTLE token clawback to winner.           │
               └──────────────────────────────────────────────┘

[1:48 — 1:50]  Zoom-out do screen recording.
               App UI se miniaturiza no centro, fundo navy retorna.
```

### NARRACAO (PiP rosto)

> *"Let me show you. Here I'm placing ships on the grid... tap Ready... the board validity proof generates client-side with NoirJS..."*
> *"Board proofs anchored on Stellar — match started..."*
> *"Battle begins — I tap to attack, the opponent's proof confirms the result..."*
> *"Hit! And when the game ends — the server generates the turns proof, submits on-chain, and claws back the BATTLE token to the winner. Three blockchain moments total."*

### TRANSICAO
App UI se miniaturiza, diagrama de arquitetura emerge ao redor.

---

## CENA 5 — ARQUITETURA + STELLAR
**Tempo:** 1:50 — 2:10 (20s)
**Camera:** PiP rosto no canto inferior-direito.

---

### TELA

```
[1:50 — 1:54]  Diagrama aparece camada por camada (slide-up):

               CAMADA 1 (topo): PLAYER DEVICE
               ┌─────────────────────────────────────┐
               │  🎮 PLAYER DEVICE                    │
               │  Noir Circuits (WASM) + Game Engine  │
               │  React Native / Expo                 │
               └──────────┬──────────┬────────────────┘
                          │          │
               Cor: #1a2a4a com glow border

[1:54 — 1:58]  CAMADA 2 (base): dois blocos aparecem simultaneamente.

                    proofs │          │ real-time turns
                           ▼          ▼
               ┌──────────────┐  ┌──────────────┐
               │  ⭐ STELLAR   │  │  💜 BACKEND   │
               │   Soroban     │  │  Express +   │
               │               │  │  Socket.io + │
               │  TX1: payment │  │  Supabase    │
               │  TX2: start   │  │              │
               │  TX3: end     │  │  matchmaking │
               │  BATTLE token │  │  turn coord  │
               │  clawback     │  │  shot verify │
               └──────────────┘  └──────────────┘
                Cor: #2845a0       Cor: #7c3aed

               Linhas conectoras animam (pontilhado pulsante).

[1:58 — 2:03]  HIGHLIGHT no bloco Stellar (borda pulsa dourado):

               ┌─────────────────────────────────────────┐
               │  PROTOCOL 25 (X-RAY)                    │
               │  ━━━━━━━━━━━━━━━━━━━                    │
               │  → Native BN254 curve operations        │
               │  → Native Poseidon2 hash function       │
               │  = The EXACT primitives our circuits use │
               └─────────────────────────────────────────┘

               Cor do texto: teal (#00d4aa)

[2:03 — 2:08]  BADGE grande no centro (slide-in):

               ┌──────────────────────────────────────────────────────┐
               │  "3 blockchain moments per PvP match"              │
               │   Payment (XLM+BATTLE) — Start (proofs) — End (turns_proof+clawback) │
               └──────────────────────────────────────────────────────┘

[2:08 — 2:10]  Diagrama inteiro faz fade suave.
```

### NARRACAO (PiP rosto)

> *"The architecture is hybrid. On-chain: three blockchain moments per match — payment, start with board proofs anchored, and end with turns_proof and BATTLE token clawback. Off-chain: Express + Socket.io handles real-time turns with millisecond latency, and Supabase persists match history and rankings."*
> *"We chose Stellar because Protocol 25 gives us native BN254 and Poseidon2 — the exact primitives our Noir circuits use. Efficient. Not emulated."*

### TRANSICAO
Diagrama faz fade. Footage de frota ao por-do-sol emerge.

---

## CENA 6 — ENCERRAMENTO
**Tempo:** 2:10 — 2:30 (20s)
**Camera:** Sem rosto. Voiceover puro.

---

### TELA

```
[2:10 — 2:15]  FOOTAGE: frota naval ao por-do-sol.
               Wide shot epico. Luz dourada. Silhuetas de navios.
               MUSICA: resolve — sai da tensao, acorde maior. Epico.
               SFX: ondas suaves.

[2:15 — 2:18]  Footage faz fade gradual pra fundo navy (#0a1628).
               LOGO "BATTLESHIP ZK" aparece grande no centro.
               Scale-in com glow dourado (#c9a634).
               SFX: sonar ping.

[2:18 — 2:23]  Abaixo do logo, TAGLINE aparece com typewriter effect:

                    "Fair by math. Fun by design."

               Fonte: Orbitron, cor: branco (#e8e8e8).
               Cursor pisca 2x depois de terminar.

[2:23 — 2:27]  Links fade-in abaixo da tagline:

                    github.com/olivmath/battleship-zk
                    Stellar Testnet  |  Noir + UltraHonk

               Fonte: Rajdhani, cor: #888.

[2:27 — 2:30]  LOGOS de parceiros alinham na base da tela:

                    [Stellar]    [Noir]    [Supabase]

               Texto final (pequeno): "Built for Stellar Hacks 2026"
               MUSICA: ultimo acorde sustenta e faz fade.
               SFX: sonar ping final. Silencio.

               TELA PRETA.
```

### NARRACAO (voiceover)

> *"Battleship ZK. Fair by math. Fun by design."*

*(silencio nos ultimos 5s — so musica e logo)*

---

## NOTAS DE PRODUCAO

### Audio — Camadas

| Camada | Descricao | Cenas |
|--------|-----------|-------|
| Musica | Cinematic drone → build → resolve | Todas |
| Voiceover | Narracao gravada (ingles) | Todas |
| SFX ambiental | Ondas, sonar, vento | 1, 6 |
| SFX impacto | Explosoes, torpedo, metal | 3B, 3C |
| SFX UI | Locks, pings, snaps, achievement | 2, 3A, 4 |

### Trilha Sonora — Referencia

- **0:00 — 0:35:** Drone grave + sonar. Tensao. (ref: Dunkirk — Supermarine)
- **0:35 — 1:20:** Build lento. Percussao sutil entra. (ref: Interstellar — No Time for Caution)
- **1:20 — 2:10:** Ritmo mais leve na demo, retorna build na arquitetura.
- **2:10 — 2:30:** Resolve. Acorde maior. Epico mas contido. Fade out.

### Gravacao do Rosto (PiP)

- **Setup:** iluminacao frontal, fundo escuro/neutro, enquadramento peito pra cima
- **Gravar cada bloco separado** — facilita edicao:
  - Take 1: Cena 2 (15s)
  - Take 2: Cena 3A (15s)
  - Take 3: Cena 3B (15s)
  - Take 4: Cena 3C (15s)
  - Take 5: Cena 4 (30s)
  - Take 6: Cena 5 (20s)
- **Voiceover separado** (cenas 1 e 6): gravar so audio, sem camera
- **Tom:** confiante, tecnico mas acessivel. Moderado — juizes precisam acompanhar.
- **PiP tamanho:** ~200x200px, canto inferior-direito, borda arredondada, sombra sutil

### Footage Naval — Cenas sugeridas

| Cena | Fonte | Descricao |
|------|-------|-----------|
| 1 | Greyhound (2020) | Destroyer no oceano, tempestade, visao aerea |
| 1 | Midway (2019) | Frota vista de cima, aereas |
| 3A | Das Boot (1981) / docs | Tripulacao preparando equipamentos |
| 3B | Midway / Greyhound | Explosao naval, torpedo impacto |
| 3C | Greyhound / Dunkirk (2017) | Navio afundando slow motion |
| 6 | Qualquer | Frota ao por-do-sol, wide shot epico |

### Screen Recording (Demo)

- Gravar no **iOS Simulator** ou **device real** via QuickTime
- Resolucao: 1080x1920 (portrait) — sera enquadrado no centro da tela 1920x1080
- **Mockar** se necessario: os loadings de proof e blockchain podem ser simulados
- Gravar fluxo completo: placement → ready → loading → battle → hit → gameover

---

## CHECKLIST DE ASSETS

### Para Gravar
- [ ] Voiceover cena 1 (hook) — so audio
- [ ] PiP rosto cena 2 (problema)
- [ ] PiP rosto cena 3A (board_validity)
- [ ] PiP rosto cena 3B (shot_proof)
- [ ] PiP rosto cena 3C (turns_proof)
- [ ] PiP rosto cena 4 (demo)
- [ ] PiP rosto cena 5 (arquitetura)
- [ ] Voiceover cena 6 (encerramento) — so audio
- [ ] Screen recording do app (demo gameplay completa)

### Para Baixar/Recortar
- [ ] Footage: oceano escuro / tempestade
- [ ] Footage: navio cortando ondas
- [ ] Footage: tripulacao preparando navio
- [ ] Footage: explosao naval / torpedo
- [ ] Footage: navio afundando slow motion
- [ ] Footage: frota ao por-do-sol
- [ ] Musica cinematic (Artlist.io / Epidemic Sound)
- [ ] SFX: sonar ping, ondas, explosao, lock click, achievement

### Para Construir (Remotion)
- [ ] Particulas sonar/radar overlay
- [ ] Glitch text effect
- [ ] Logo animation com glow
- [ ] Split screen animado (problema)
- [ ] Grid 6x6 com ship placement animation
- [ ] Hash visualization (Matrix → Poseidon)
- [ ] Crosshair + HIT effect
- [ ] Replay animation (dois grids)
- [ ] Overlay labels (demo)
- [ ] Diagrama arquitetura animado
- [ ] Typewriter text effect
- [ ] Radar sweep background
- [ ] PiP frame component
