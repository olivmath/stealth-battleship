# Diário de Bordo: ZK Battleship

## Parte 4 — "Dois navios, uma batalha"

*Conectando dois jogadores em tempo real, sobrevivendo a race conditions, e o teste E2E de 33 turnos*

---

### O desafio que parecia simples

Circuitos ZK? Prontos. Verificação on-chain? Funcionando. Agora só faltava o "jogo" — fazer dois jogadores se encontrarem e jogarem Batalha Naval em tempo real.

Parece a parte mais trivial, certo? Afinal, é "só" um servidor de WebSocket que gerencia turnos. Exceto que cada ação de cada jogador envolve uma prova criptográfica, cada resposta precisa ser verificada, e qualquer jogador pode desconectar a qualquer momento.

---

### A stack: Express + Socket.io

O backend é um servidor Express com Socket.io para comunicação em tempo real via WebSocket.

```
backend/src/
  auth/          # Autenticação Ed25519
  matchmaking/   # Fila, friend match, gerenciamento de salas
  battle/        # Lógica de turno, ataque, resultado, vitória
  soroban/       # Adapter para transações on-chain
  ws/            # WebSocket server, rate limit, reconexão
  shared/        # Supabase, circuitos, persistência
```

A escolha de Socket.io em vez de WebSocket puro foi prática: ele lida com reconexão automática, rooms, e fallback para HTTP long-polling quando WebSocket não está disponível.

---

### Autenticação: Ed25519 sem wallet

Uma decisão importante: não usar carteira Stellar para autenticação do jogo. Em vez disso, cada jogador gera um par de chaves Ed25519 localmente. Quando conecta ao servidor, assina um desafio com sua chave privada:

```typescript
// Cliente: assina o handshake
export function signAuth(keys, timestamp, nonce) {
    const message = `${keys.publicKeyHex}:${timestamp}:${nonce}`;
    const msgBytes = new TextEncoder().encode(message);
    const sig = nacl.sign.detached(msgBytes, keys.fullSecretKey);
    return { publicKey: keys.publicKeyHex, timestamp, nonce, signature };
}
```

O servidor verifica a assinatura no middleware do Socket.io:

```typescript
io.use((socket, next) => {
    const auth = socket.handshake.auth;
    const result = verifyAuth(auth);
    if (!result.valid) return next(new Error('Auth failed'));
    socket.data.publicKey = result.publicKey;
    next();
});
```

Cada ação durante o jogo (ataque, resposta, reveal) também é assinada. Se o servidor receber uma ação com assinatura inválida, rejeita silenciosamente. Isso impede que alguém falsifique ações de outro jogador.

---

### Matchmaking: encontrando o oponente

Dois modos: aleatório e amigo.

**Aleatório:** o jogador entra numa fila. Quando outro jogador com o mesmo tamanho de grid entra, são pareados automaticamente.

```typescript
export function findRandomMatch(publicKey, socketId, gridSize) {
    // Já está em partida?
    if (playerToMatch.has(publicKey)) return { type: 'already_in_match' };

    // Acha oponente compatível na fila
    const idx = matchQueue.findIndex(
        e => e.gridSize === gridSize && e.publicKey !== publicKey
    );

    if (idx === -1) {
        matchQueue.push({ publicKey, socketId, gridSize });
        return { type: 'queued' };
    }

    // Encontrou! Remove da fila e cria partida
    const opponent = matchQueue.splice(idx, 1)[0];
    const match = createMatch(
        { publicKey, socketId },
        { publicKey: opponent.publicKey, socketId: opponent.socketId },
        gridSize
    );
    return { type: 'matched', match };
}
```

**Amigo:** um jogador cria a sala e recebe um código de 6 dígitos. O outro entra com esse código.

```typescript
export function createFriendMatch(publicKey, socketId, gridSize) {
    const matchCode = generateMatchCode(); // "782336"
    const match = { id: generateId(), matchCode, status: 'waiting', ... };
    matches.set(match.id, match);
    matchCodeIndex.set(matchCode, match.id);
    return { matchId: match.id, matchCode };
}
```

Simples no papel. Na prática? Uma fábrica de bugs.

---

### A avalanche de race conditions

Quando dois jogadores estão conectados via WebSocket e fazendo ações simultâneas, tudo que pode dar errado dá.

**Bug 1: entradas duplicadas na fila.**
Um jogador clicava "buscar partida" duas vezes rápido. Entrava na fila duas vezes. Quando pareava com alguém, a segunda entrada ficava órfã, impedindo o jogador de entrar em outra partida.

```typescript
// Fix: checar se já está na fila
const alreadyQueued = matchQueue.some(e => e.publicKey === publicKey);
if (alreadyQueued) return { type: 'queued' };
```

Commit `bb19cd9`: `fix(backend): prevent state conflicts in matchmaking interactor`

**Bug 2: jogador terminava partida mas não podia iniciar outra.**
O `playerToMatch` mapeava publicKey -> matchId, mas não era limpo quando a partida terminava. O jogador ficava "preso" numa partida fantasma.

```typescript
// Fix: limpar no endMatch
export function endMatch(match, winnerKey, reason) {
    if (match.player1) playerToMatch.delete(match.player1.publicKey);
    if (match.player2) playerToMatch.delete(match.player2.publicKey);
    match.status = 'finished';
}
```

Commit `5289564`: `fix(backend): clear playerToMatch on match end for immediate re-queue`

**Bug 3: rate limit persistindo entre turnos.**
Coloquei um rate limit de 1 ataque por segundo para evitar spam. Mas o cooldown não resetava entre turnos — então o jogador atacava, esperava a resposta, e quando era seu turno de novo, o cooldown ainda estava ativo do turno anterior.

```typescript
// Fix: resetar rate limit quando o turno começa
function emitTurnStart(io, match) {
    const activeSocketId = match.currentTurn === match.player1.publicKey
        ? match.player1.socketId : match.player2.socketId;
    resetRateLimit(activeSocketId);
    // ...
}
```

Commit `318fd02`: `fix(backend): reset rate limit on turn start to prevent cross-turn cooldown`

---

### O fluxo de uma partida completa

Com os bugs corrigidos, o fluxo de uma partida PvP ficou assim:

```
Cliente A                    Backend                     Cliente B
    |  connect + auth Ed25519    |                           |
    |-------------------------->|                           |
    |                           |   connect + auth Ed25519  |
    |                           |<--------------------------|
    |                           |                           |
    |  create_friend             |                           |
    |-------------------------->|                           |
    |  <- matchCode: 782336     |                           |
    |                           |   join_friend(782336)     |
    |                           |<--------------------------|
    |  match_found              |          match_found      |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |  placement(hash + proof)  |                           |
    |-------------------------->|  verify board_validity    |
    |                           |   <- 728ms                |
    |                           |  placement(hash + proof)  |
    |                           |<--------------------------|
    |                           |  verify board_validity    |
    |                           |   <- 722ms                |
    |  both_ready               |          both_ready       |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |                           |  [Soroban: verify_board x2
    |                           |   + open_match]           |
    |                           |                           |
    |  attack(0,0)              |                           |
    |-------------------------->|  incoming_attack(0,0)     |
    |                           |-------------------------->|
    |                           |  shot_result(hit + proof) |
    |                           |<--------------------------|
    |                           |  verify shot_proof        |
    |                           |   <- 200ms                |
    |  result_confirmed(hit)    |                           |
    |<--------------------------|  turn_start(next)         |
    |                           |-------------------------->|
    |                           |                           |
    |        ... 33 turnos ...  |                           |
    |                           |                           |
    |  game_over(winner: A)     |   game_over(winner: A)    |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |  reveal(ships + nonce)    |                           |
    |-------------------------->|                           |
    |                           |  reveal(ships + nonce)    |
    |                           |<--------------------------|
    |                           |  generate turns_proof     |
    |                           |   <- 11.7s                |
    |  turns_proof              |          turns_proof      |
    |<--------------------------|-------------------------->|
    |                           |                           |
    |                           |  [Soroban: close_match]   |
```

Cada `shot_proof` é verificado em ~200ms. A `turns_proof` final leva ~12 segundos para gerar no servidor (é um circuito grande — 100 ataques por jogador).

---

### Desconexão e grace period

E se um jogador desconecta no meio da partida? Não pode perder automaticamente — talvez seja uma queda de conexão momentânea. Mas também não pode ficar esperando para sempre.

Solução: grace period de 60 segundos.

```typescript
socket.on('disconnect', (reason) => {
    const match = getPlayerMatch(publicKey);
    if (match && match.status === 'battle') {
        // Avisa o oponente
        io.to(opponentSocketId).emit('pvp:opponent_disconnected');

        // Espera 60s
        disconnectGrace.set(publicKey, setTimeout(() => {
            // Não reconectou? Auto-forfeit
            endMatch(match, opponentKey, 'disconnect_timeout');
            io.to(opponentSocketId).emit('battle:game_over', {
                winner: opponentKey,
                reason: 'opponent_disconnected',
            });
        }, 60_000));
    }
});
```

Se o jogador reconecta dentro de 60 segundos, o grace period é cancelado e o jogo continua normalmente. O socket ID é atualizado na sala, e o jogador recebe um evento `pvp:reconnected` com o estado atual.

---

### O teste E2E: 33 turnos, 44 segundos

O momento decisivo: um teste end-to-end que simula uma partida completa. Dois "jogadores" gerados automaticamente, com provas ZK reais, verificação real, e submissão real on-chain.

```
Phase 1: Setup
  Circuits loaded (hash_helper, board_validity, shot_proof)
  Board proofs generated (P1: 14592 bytes, P2: 14592 bytes)
  Both players connected

Phase 2: Matchmaking
  Match created: 0b9aece78758d687, code: 782336
  Both joined match (10x10)

Phase 3: Placement
  Both ready! First turn: 6a144be1...

Phase 4: Battle
  Turn 5: P1 -> (0,2) hit
  Turn 9: P1 -> (0,4) hit [SUNK Carrier]
  Turn 17: P1 -> (2,3) hit [SUNK Battleship]
  Turn 23: P1 -> (4,2) hit [SUNK Cruiser]
  Turn 29: P1 -> (6,2) hit [SUNK Submarine]
  Turn 33: P1 -> (8,1) hit [SUNK Destroyer]
  Game over! Winner: Player1, reason: all_ships_sunk, turns: 33

Phase 5: Reveal & Turns Proof
  turns_proof received (29184 hex chars)

  Duration: 44.4s
  Status: ALL PASSED
```

33 turnos. 17 ataques do P1, 16 do P2. 33 provas `shot_proof` verificadas (~200ms cada). 2 provas `board_validity` verificadas (~730ms cada). 1 `turns_proof` gerada em 11.7 segundos. 4 transações Soroban no testnet. Tudo em 44 segundos.

O log do backend durante esse teste é uma sinfonia:

```
[battle] 6a144be1... board_validity ✓ (728ms)
[battle] 0ce08348... board_validity ✓ (722ms)
[battle] Match 0b9aece78758d687 — BATTLE START
[stellar] opening match on-chain (3 txs)...
[battle] 6a144be1... attacks (0,0)
[battle] 0ce08348... shot_proof ✓ (330ms)
[battle] 0ce08348... responds: hit at (0,0)
... 31 turnos ...
[battle] WIN CONDITION MET
[battle] turns_proof generated (11704ms)
[stellar] closing match on-chain sessionId=3...
[stellar] close_match confirmed
```

Tudo funcionando junto. ZK, WebSocket, Soroban. Em paralelo — enquanto os jogadores se atacam, as transações Soroban são submetidas em background.

---

### Persistência: Supabase como banco off-chain

Nem tudo vai on-chain. O Supabase guarda o que é operacional:

| Tabela | O que guarda |
|--------|-------------|
| `matches` | Registro de partidas (players, grid, status, vencedor) |
| `attacks` | Histórico de cada ataque (coordenadas, resultado, turno) |
| `player_stats` | Wins, losses, total de partidas por jogador |
| `proof_logs` | Log de cada prova verificada (circuito, tempo, válida?) |

A blockchain é o tribunal. O Supabase é o cartório. Um garante a verdade; o outro organiza os documentos.

---

### O que temos até aqui

Ao final dessa fase:

- Backend Express + Socket.io gerenciando partidas PvP em tempo real
- Autenticação Ed25519 em todas as ações
- Matchmaking aleatório e por código de amigo
- Verificação de `board_validity` e `shot_proof` a cada ação
- Grace period de 60s para reconexão
- Geração de `turns_proof` no servidor após game over
- Submissão fire-and-forget de provas on-chain
- Teste E2E completo passando (33 turnos, 44s)
- Deploy no Render (plano free, região Oregon)

A máquina funciona. Mas só funciona porque aprendemos várias lições pelo caminho.

---

*Anterior: [Parte 3 — "A blockchain que verificou a prova"](./03-a-blockchain-que-verificou.md)*
*Próximo: [Parte 5 — "A lição que custou 214 XLM"](./05-a-licao-que-custou-214-xlm.md)*
