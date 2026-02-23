# Guia de Cenas — Stealth Battleship Trailer

Leia como uma historia. Cada cena descreve o que voce ve, ouve e sente.
Os tempos entre colchetes sao o relogio global do video.

---

## CENA 1 — Hook Cinematico [0:00 — 0:20]

Tela preta. Silencio total. Voce so ouve uma onda distante e um unico ping de sonar.

Depois de 3 segundos, imagens de oceano escuro e nublado aparecem em camera lenta. Um navio de guerra emerge da neblina visto de cima. Particulas verdes de sonar pulsam sobre a agua como um radar vivo. Uma musica grave e tensa comeca, estilo Dunkirk.

Aos 8 segundos, sobre a imagem do casco do navio cortando ondas, aparece a frase:

    "In war, information is power."

O texto treme como um sinal de radar instavel — efeito glitch.

Aos 13 segundos a frase some e uma nova entra com o mesmo efeito:

    "But what if you could prove...
     without revealing?"

Aos 17 segundos a imagem escurece e o logo STEALTH BATTLESHIP emerge do centro com um brilho dourado. Abaixo: "Trustless Naval Warfare on Stellar". Dois pings de sonar marcam o momento.

Narracao (voiceover, sem rosto):
"In war... information is power. But what if you could prove your strategy... without revealing it?"

---

## CENA 2 — O Problema [0:20 — 0:35]

A tela se divide em dois lados com um slide horizontal.

Lado esquerdo — borda vermelha pulsando — mostra "TRADITIONAL BATTLESHIP" com um icone de olho e dois boards visiveis. Texto: "Server sees everything".

Lado direito — borda verde solida — mostra "STEALTH BATTLESHIP" com um cadeado e dois boards com "???". Texto: "No one sees your board".

Neste momento o rosto do apresentador aparece num quadradinho no canto inferior direito (PiP).

Aos 28 segundos o lado esquerdo explode — fragmentos se desintegram como um navio atingido. O lado direito fica intacto e brilha mais verde.

Aos 30 segundos o lado direito se expande para tela inteira com a frase centralizada:

    "Zero Knowledge. Full Privacy."

Narracao (PiP):
"In regular digital Battleship, someone always has to see both boards — a server, a smart contract, or an end-game reveal. That means you have to trust someone not to cheat. We eliminate that entirely. With ZK proofs, no one ever sees your board — not the server, not the blockchain, anybody."

---

## CENA 3A — Proof 1: Board Validity [0:35 — 0:50]

Texto "PROOF 1 — Board Validity" aparece com efeito de escala. Subtitulo: "Prove your board is legal".

No fundo, imagens suaves de tripulacao preparando equipamentos num navio (40% de opacidade).

No centro aparece um grid 10x10. Os navios surgem um a um com animacao de snap:
- Patrol Boat (2 celulas) — snap
- Patrol Boat (2 celulas) — snap
- Destroyer (3 celulas) — snap

Depois numeros hexadecimais fluem dos navios como particulas, convergem para o centro e formam um hash Poseidon: "0x7a3f...b2c1".

Ao lado aparecem dois badges:
- Cadeado: "Private: ship positions"
- Globo: "Public: board_hash only"

O grid se miniaturiza e um badge desliza de baixo: "Verified on-chain via Soroban UltraHonk". Som de tranca.

Narracao (PiP):
"Board validity — when you place your ships, a ZK proof generated on the device ensures that your board is valid — correct ship sizes, no overlaps, within bounds — without revealing where."

---

## CENA 3B — Proof 2: Shot Proof [0:50 — 1:05]

Texto "PROOF 2 — Shot Proof" aparece. Subtitulo: "Prove every hit/miss is honest".

Um grid 10x10 aparece no centro. Uma mira animada (crosshair) se move ate a celula [3,4]. Som de targeting. A mira trava e brilha.

Corte rapido: 2 segundos de explosao naval — torpedo atinge casco, agua explode, camera chacoalha.

Volta pro grid. A celula [3,4] acende laranja. Texto grande: "HIT!" com brilho de fogo.

Abaixo, formula aparece como typewriter:

    is_hit == (board[3][4] == 1) ✓

Badge: "board_hash matches committed hash ✓"

Frase final em destaque:

    "Lying is mathematically impossible."

Badge: "Generated every turn | ~1-2s"

Narracao (PiP):
"Shot proof — whenever you receive a shot, the device responds with a proof generated on itself that confirms whether it was a hit or a miss, verified against the hash of your committed board. Lying is mathematically impossible."

---

## CENA 3C — Proof 3: Turns Proof [1:05 — 1:20]

Texto "PROOF 3 — Turns Proof" aparece. Subtitulo: "Prove the entire game was fair".

No fundo, imagem de navio afundando em camera lenta (50% opacidade). Dramatico.

Sobre a imagem, dois grids lado a lado (Player A e Player B). Um replay animado mostra os tiros aparecendo em sequencia rapida nos dois grids — vermelho = hit, azul = miss. Como um fast-forward de uma partida inteira em 3 segundos.

O replay congela. Um trofeu dourado emerge no centro entre os grids com brilho e som de conquista.

Texto: "Winner computed IN the proof"

Badge grande no final:

    "The circuit IS the referee."
    "Settles on-chain → BATTLE token clawback"

Narracao (PiP):
"Move proof — at the end of the game, the entire game sequence is reproduced within a circuit to calculate and prove the winner by the backend and saved on chain."

---

## CENA 4 — Demo do Jogo [1:20 — 1:50]

Tela preta. Texto aparece como typewriter dourado:

    "Let me show you."

Um ping de sonar marca o inicio da demo.

A partir daqui, uma gravacao de tela do app ocupa o centro da tela dentro de um frame de celular. Em cada fase da demo, um overlay label aparece no canto superior direito explicando o que esta acontecendo:

[1:22 — 1:27] Placement — jogador arrasta navios.
Label: "Ship Placement — drag & drop"

[1:27 — 1:31] Tap no botao Ready. Loading com RadarSpinner.
Label: "board_validity proof generating — NoirJS + bb.js (client-side WASM)"

[1:31 — 1:34] Deploying to blockchain.
Label: "Soroban TX 2: board proofs anchored on Stellar — match started"

[1:34 — 1:39] Tela de batalha. Jogador toca celula pra atacar.
Label: "Player attacks — opponent proves response"

[1:39 — 1:43] Resultado HIT com animacao de fogo.
Label: "shot_proof verified — result honest"

[1:43 — 1:48] Game over — "Victory!" com XP e rank.
Label: "turns_proof → Soroban TX 3: winner settled. BATTLE token clawback."

[1:48 — 1:50] Zoom-out do celular. App se miniaturiza, fundo navy retorna.

Narracao (PiP):
"Let me show you the game in action. Here I'm placing my ships on the 10x10 grid... drag and drop... or auto placed. When I tap Ready, you can see 'Securing your fleet' — that's the board_validity proof being generated client-side with NoirJS. Now the board hash is committed on Stellar via Soroban... Battle begins — I tap a cell to attack... the opponent's device generates a shot_proof to confirm the result... hit! And when the game ends — the server generates the turns_proof, submits it on-chain, and claws back the BATTLE token to the winner."

---

## CENA 5 — Arquitetura + Stellar [1:50 — 2:10]

Um diagrama aparece camada por camada com animacao de slide.

Primeiro o topo — PLAYER DEVICE: "Noir Circuits (WASM) + Game Engine + React Native / Expo". Caixa com borda branca e glow.

Depois duas setas: "proofs ↓" (teal) e "↓ real-time turns" (laranja).

Dois blocos na base aparecem simultaneamente:

STELLAR (Soroban) — caixa azul:
- TX 1: payment (XLM + BATTLE token issuance)
- TX 2: start (board proofs anchored on-chain)
- TX 3: end (turns_proof + BATTLE token clawback)

BACKEND: Express + Socket.io + Supabase — caixa roxa:
- Matchmaking (Socket.io)
- Turn coordination (real-time)
- shot_proof verification
- Supabase: match history, global rank, stats
- ~ms latency

As linhas conectoras pulsam como pontilhado animado.

Aos 1:58 o bloco Stellar ganha destaque com borda dourada pulsando:

    PROTOCOL 25 (X-RAY)
    → Native BN254 curve operations
    → Native Poseidon2 hash function
    = The EXACT primitives our circuits use

Badge central desliza:

    "3 blockchain moments per PvP match"
    Payment (XLM + BATTLE token) — Start (board proofs anchored) — End (turns_proof + clawback)

O diagrama todo faz fade suave.

Narracao (PiP):
"The architecture is hybrid. On-chain, we have three blockchain moments per match — payment and BATTLE token issuance, start with board proofs anchored, and end with the turns_proof settled and BATTLE token clawed back to the winner. We chose Stellar because Protocol 25 X-Ray gives us native BN254 curve operations and Poseidon2 hashing — the exact primitives our Noir circuits use. This means proof verification on-chain is efficient, not emulated."

---

## CENA 6 — Encerramento [2:10 — 2:30]

Imagens de frota naval ao por-do-sol. Wide shot epico. Luz dourada. Silhuetas de navios. A musica resolve — sai da tensao, acorde maior. Ondas suaves.

A imagem faz fade para fundo navy escuro. O logo STEALTH BATTLESHIP aparece grande no centro com escala e brilho dourado. Ping de sonar.

Abaixo do logo, o tagline aparece letra por letra:

    "Fair by math. Fun by design."

O cursor pisca duas vezes e para.

Links aparecem em fade:

    github.com/olivmath/battleship-zk
    Stellar Testnet | Noir + UltraHonk

Logos dos parceiros se alinham na base: Stellar, Noir, Supabase.

Texto final pequeno: "Built for Stellar Hacks 2026"

A musica sustenta o ultimo acorde e faz fade. Um ping de sonar final. Silencio. Tela preta.

Narracao (voiceover, sem rosto):
"Stealth Battleship proves that zero-knowledge isn't just for DeFi — it's the foundation of fair, trustless gaming. On Stellar's Protocol 25, we have everything we need to make this real. Fair by math. Fun by design."

Os ultimos 5 segundos sao so musica e logo.
