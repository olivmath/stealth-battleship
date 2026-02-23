- [ ] assinar ataques por baixo dos panos para o backend identificar
- [ ] enviar provas para Soroban validar on-chain (precisa criar um protocolo pra isso uma prova no comeco e outra no final)
- [ ] backend deve salvar infos para o app como historico e rank global e etc para ajudar
- [ ] provas sao enviadas para a blockchain via backend para facilitar e salvar txhash no banco
- [ ] preparar migracao do backend para server funciton do supabase 
- [ ] Mostrar as provas no historico
- [ ] implementar o modelo 3d na home
- [ ] testanto o web no meu iphone deu isso na hora de criar a wallet: undefined is not an object (evaluating 'crypto.subtle.digest')
- [ ] na apresentacao as matrizes deve ter o cochete grande como na imagem
- [ ] garanta que a chave esta sendo gerada e salva criptografada no localstorage
- [ ] adicionar barra de vida dos jogadores para saber o progresso da partida
- [ ] remover o modo visualização dupla
- [ ] se colocar o pin errado ele só pinta de vermelho as bolinhas por 1s e apagar tudo para comecar de novo; adicione uma vibracao e como que uma balanco da esquerda direita como balancar a cabeça dizendo nao nas bolinhas  do pin; Resumo das mudanças:

  PinModal (web + mobile)  - Nova prop error?: boolean
  - Quando error=true: dots ficam vermelhos (fire color), animacao de shake
  lateral (balanco "nao"), bloqueia input durante a animacao
  - Apos 800ms: limpa o PIN, reseta o estado, refoca o input para tentar de novo

  CSS (web) - Keyframe headShake: translateX oscilando -8px → +7px → -6px → ... →
  0 (decrescente, como balanco de cabeca)

  Reanimated (mobile) - Mesma sequencia de shake via withSequence + withTiming

  Login.tsx + Wallet.tsx - alert() substituido por setPinError(true) +
  haptics.error() (vibracao)
  - PinModal recebe error={pinError} e se auto-reseta

✻ Sautéed for 2m 14s

❯ iplmentou para o web e mobile? 

⏺ Sim para o PinModal (web + mobile), mas falta verificar se as pages do mobile
  (Login, Wallet) tambem foram atualizadas para usar a prop error. Deixa eu
  checar.

⏺ Searched for 1 pattern (ctrl+o to expand)

⏺ O mobile ainda nao usa PinModal em nenhuma page — so o componente existe. Apenas
   o web tem as pages Login e Wallet que usam PinModal.

  Resumo do que foi implementado:

  Column 1: PinModal component (error prop, shake, red dots, auto-clear)
  Web: Done
  Mobile: Done
  ────────────────────────────────────────
  Column 1: Login.tsx (error prop + haptics.error)
  Web: Done
  Mobile: N/A (nao existe ainda)
  ────────────────────────────────────────
  Column 1: Wallet.tsx (error prop + haptics.error)
  Web: Done
  Mobile: N/A (nao existe ainda)

  Ambos os componentes PinModal estao prontos e identicos em comportamento. Quando
   o mobile criar as pages de Login/Wallet, basta passar error={pinError} da mesma
   forma que o web.

✻ Baked for 49s

❯ crie um plano para os dois serem igual!!


- [ ] Contexto

 O jogo Battleship ZK tem single-player funcionando (web + mobile) com provas ZK
 geradas localmente. O backend Express (porta 3001) hoje serve apenas como proof
 server stateless. O objetivo é transformá-lo no servidor PvP completo:
 matchmaking, coordenação de turnos, verificação de provas, e autenticação via
 assinatura Stellar. Clientes (web e mobile) geram provas localmente e o servidor
  verifica. Cross-platform: mobile vs mobile, web vs web, mobile vs web.

 ---
 Arquitetura Final

 Mobile (Expo)                          Web (Vite+React)
 ├─ WebView ZK (provas locais)          ├─ WASM ZK (provas locais)
 ├─ Stellar Wallet (Ed25519 sign)       ├─ Stellar Wallet (Ed25519 sign)
 └─ Socket.io client ──────┐            └─ Socket.io client ──────┐
                           │                                       │
                           ▼                                       ▼
                  ┌─────────────────────────────────┐
                  │     Backend Express + Socket.io  │
                  │     (porta 3001)                 │
                  ├─────────────────────────────────┤
                  │  Auth: verificação de assinatura │
                  │  Matchmaking: fila + friend code │
                  │  Game State: Map<matchId, Match> │
                  │  Turnos: coordenação bidirecional│
                  │  ZK Verify: circuits já carregados│
                  │  Timeout: 30s auto-forfeit       │
                  └─────────────────────────────────┘

 ---
 Bloco 1 — WebSocket + Auth no Backend

 Objetivo: Adicionar Socket.io ao Express, autenticar players via assinatura
 Stellar.

 Backend (backend/src/)

 Dependências novas: socket.io, tweetnacl

 Arquivos novos:
 - backend/src/ws/socket.ts — setup Socket.io no servidor HTTP existente
 - backend/src/auth/verifier.ts — verifica assinatura Ed25519
 (tweetnacl.sign.detached.verify)
 - backend/src/auth/entities.ts — tipos de autenticação

 Fluxo de autenticação:
 1. Cliente gera challenge: { publicKey, timestamp, nonce }
 2. Cliente assina o challenge com sua secret key Stellar (Ed25519)
 3. Conecta via Socket.io enviando { publicKey, timestamp, nonce, signature } no
 auth handshake
 4. Servidor verifica assinatura com tweetnacl, rejeita se inválida ou timestamp
 > 30s
 5. Socket fica associado ao publicKey (identidade do player)

 Arquivos existentes modificados:
 - backend/src/server.ts — criar httpServer, passar para Socket.io + Express
 - backend/src/app.ts — exportar app separado do listen

 Verificação: Conectar via socket.io-client no terminal, enviar auth com
 assinatura válida → aceito. Assinatura inválida → rejeitado.

 ---
 Bloco 2 — Matchmaking

 Objetivo: Pareamento random + friend code via WebSocket events.

 Backend

 Arquivos novos:
 - backend/src/matchmaking/entities.ts — tipos (MatchQueue, MatchRoom)
 - backend/src/matchmaking/interactor.ts — lógica de pareamento
 - backend/src/matchmaking/translator.ts — handlers Socket.io

 Estado em memória:
 // Map<string, MatchRoom> — matchId → sala
 // Map<string, string> — publicKey → matchId (player ativo)
 // Array<QueueEntry> — fila de matchmaking

 Eventos Socket.io:

 Cliente → Servidor: match:find_random { gridSize }
 Servidor → Cliente: match:found { matchId, opponent }
 ────────────────────────────────────────
 Cliente → Servidor: match:cancel_search
 Servidor → Cliente: match:search_cancelled
 ────────────────────────────────────────
 Cliente → Servidor: match:create_friend { gridSize }
 Servidor → Cliente: match:friend_created { matchId, matchCode }
 ────────────────────────────────────────
 Cliente → Servidor: match:join_friend { matchCode }
 Servidor → Cliente: match:friend_joined { matchId, opponent }
 ────────────────────────────────────────
 Cliente → Servidor:
 Servidor → Cliente: match:opponent_joined { opponent } (para quem criou)
 ────────────────────────────────────────
 Cliente → Servidor:
 Servidor → Cliente: match:error { message }

 MatchRoom (em memória):
 interface MatchRoom {
   id: string;
   status: 'waiting' | 'placing' | 'battle' | 'finished';
   gridSize: number;
   matchCode?: string;
   player1: { publicKey: string; socketId: string };
   player2?: { publicKey: string; socketId: string };
   // ... (expandido no Bloco 3)
 }

 Verificação: 2 clientes socket.io → match:find_random com mesmo gridSize → ambos
  recebem match:found.

 ---
 Bloco 3 — Game Flow (Turnos + Provas)

 Objetivo: Coordenação completa de turnos com verificação ZK.

 Backend

 Arquivos novos:
 - backend/src/battle/entities.ts — tipos de batalha (Attack, MatchState)
 - backend/src/battle/interactor.ts — lógica de turnos, win condition
 - backend/src/battle/translator.ts — handlers Socket.io de batalha

 MatchRoom expandido:
 interface MatchRoom {
   // ... campos do Bloco 2
   player1BoardHash?: string;
   player2BoardHash?: string;
   player1BoardProof?: Uint8Array;
   player2BoardProof?: Uint8Array;
   player1Ready: boolean;
   player2Ready: boolean;
   currentTurn?: string;       // publicKey de quem ataca
   turnNumber: number;
   attacks: Attack[];
   turnTimer?: NodeJS.Timeout;  // 30s auto-forfeit
   winner?: string;
   shipSizes: number[];         // [5,4,3,3,2] para 10x10
 }

 Eventos Socket.io — Placement:

 Cliente → Servidor: placement:ready { matchId, boardHash, proof }
 Servidor → Cliente: placement:opponent_ready
 ────────────────────────────────────────
 Cliente → Servidor:
 Servidor → Cliente: placement:both_ready { firstTurn }
 ────────────────────────────────────────
 Cliente → Servidor:
 Servidor → Cliente: placement:proof_invalid { reason }

 Fluxo placement:
 1. Player envia placement:ready com boardHash + boardValidity proof
 2. Servidor verifica proof usando circuit board_validity já carregado
 3. Se inválido: placement:proof_invalid, match cancelado
 4. Se válido: marca ready. Quando ambos ready → sorteia firstTurn →
 placement:both_ready

 Eventos Socket.io — Batalha:

 Cliente → Servidor: battle:attack { matchId, row, col }
 Servidor → Cliente: battle:incoming_attack { row, col, turnNumber } (só
 defensor)
 ────────────────────────────────────────
 Cliente → Servidor: battle:shot_result { matchId, attackId, result,
   sunkShipName?, proof }
 Servidor → Cliente: battle:result_confirmed { row, col, result, sunkShipName?,
   turnNumber } (ambos)
 ────────────────────────────────────────
 Cliente → Servidor: battle:forfeit { matchId }
 Servidor → Cliente: battle:opponent_forfeit
 ────────────────────────────────────────
 Cliente → Servidor:
 Servidor → Cliente: battle:turn_start { currentTurn, turnNumber, deadline }
   (ambos)
 ────────────────────────────────────────
 Cliente → Servidor:
 Servidor → Cliente: battle:game_over { winner, reason }
 ────────────────────────────────────────
 Cliente → Servidor:
 Servidor → Cliente: battle:proof_invalid { reason } → match cancelado, cheater
   perde

 Fluxo de um turno:
 1. Servidor emite battle:turn_start { currentTurn: "G...", deadline }
    → Inicia timer 30s

 2. Atacante envia battle:attack { row, col }
    → Servidor valida (é o turno dele? coordenada válida? não repetida?)
    → Servidor emite battle:incoming_attack para defensor
    → Reinicia timer 30s (defensor tem 30s para responder)

 3. Defensor calcula hit/miss localmente
    → Gera shotProof (ZK local, ~1-3s)
    → Envia battle:shot_result { result, proof }

 4. Servidor verifica shotProof via circuit shot_proof
    → Se válido: emite battle:result_confirmed para ambos
    → Troca turno, emite battle:turn_start
    → Se inválido: battle:proof_invalid, cheater perde

 5. Se timer 30s expira sem resposta: auto-forfeit

 Win condition: Servidor conta sunk ships. Quando defensor reporta result: "sunk"
  e total de navios afundados == NUM_SHIPS → battle:game_over.

 Verificação: 2 clientes jogam partida completa via socket events. Testar: proof
 inválida → cheater perde. Timeout → auto-forfeit.

 ---
 Bloco 4 — Assinatura de Jogadas (Stellar)

 Objetivo: Cada jogada é assinada pelo player, criando log auditável.

 Backend

 Arquivo modificado: backend/src/auth/verifier.ts

 Cada evento do cliente inclui signature:
 // Cliente assina: JSON.stringify({ matchId, action, payload, timestamp })
 // Servidor verifica antes de processar

 battle:attack { matchId, row, col, timestamp, signature }
 battle:shot_result { matchId, attackId, result, proof, timestamp, signature }
 placement:ready { matchId, boardHash, proof, timestamp, signature }

 Servidor:
 1. Extrai publicKey do socket (definido no auth handshake)
 2. Reconstrói mensagem assinada
 3. Verifica com tweetnacl.sign.detached.verify(message, signature, publicKey)
 4. Rejeita se assinatura inválida

 Web + Mobile

 Arquivo novo em cada: src/pvp/signer.ts
 - Função signAction(secretKey, action, payload) → retorna signature
 - Desencripta secret key do wallet (pede PIN uma vez no início da partida)

 ---
 Bloco 5 — Integração Web

 Objetivo: Substituir mock PvP por WebSocket real no frontend web.

 Dependência nova: socket.io-client

 Arquivos novos:

 - web/src/pvp/entities.ts — tipos PvP (PvPPhase, PvPMatch)
 - web/src/pvp/adapter.ts — wrapper Socket.io (connect, emit, on)
 - web/src/pvp/interactor.ts — lógica PvP (findMatch, submitPlacement, attack,
 respond)
 - web/src/pvp/translator.tsx — PvPProvider + usePvP hook + context
 - web/src/pvp/signer.ts — assinatura de jogadas com Stellar key

 Arquivos modificados:

 - web/src/pages/PvpLobby.tsx — remover mocks, usar usePvP().findRandomMatch()
 - web/src/pages/PvpFriend.tsx — remover mocks, usar usePvP().createFriendMatch()
  / joinFriendMatch()
 - web/src/pages/Placement.tsx — no modo PvP: gerar boardValidity proof →
 usePvP().submitPlacement(boardHash, proof); subscription espera
 placement:both_ready
 - web/src/pages/Battle.tsx — no modo PvP: NÃO usar OpponentStrategy; usar fluxo
 baseado em eventos:
   - Meu turno: usePvP().attack(row, col) → esperar battle:result_confirmed
   - Turno inimigo: ouvir battle:incoming_attack → calcular resultado → gerar
 shotProof → usePvP().submitShotResult()
 - web/src/services/pvpMock.ts — deprecar (manter TURN_TIMER_SECONDS)
 - web/src/App.tsx — adicionar env VITE_WS_URL (default: ws://localhost:3001)

 Verificação: 2 abas do browser jogando uma partida completa.

 ---
 Bloco 6 — Integração Mobile

 Objetivo: Mesma integração do Bloco 5 para React Native.

 Dependência nova: socket.io-client (funciona em RN)

 Arquivos novos (espelham web):

 - mobile/src/pvp/entities.ts
 - mobile/src/pvp/adapter.ts
 - mobile/src/pvp/interactor.ts
 - mobile/src/pvp/translator.tsx
 - mobile/src/pvp/signer.ts

 Arquivos modificados:

 - mobile/app/pvp-lobby.tsx — remover mocks, usar hooks PvP
 - mobile/app/pvp-friend.tsx — idem
 - mobile/app/placement.tsx — submitPlacement via socket
 - mobile/app/battle.tsx — turnos via socket events

 Diferença chave:

 - Provas ZK via WebView (não WASM direto) — fluxo assíncrono via bridge, mas
 mesma interface
 - Assinatura usa expo-crypto para derivação de chave do PIN

 Verificação: Player A no browser, Player B no Expo Go → partida cross-platform
 completa.

 ---
 Bloco 7 — Resiliência + Polish

 Objetivo: Lidar com desconexões, reconexão, e edge cases.

 Backend:

 - Reconexão: Player desconecta → grace period 60s → se não reconectar,
 auto-forfeit
 - Match cleanup: Matches "waiting" sem atividade > 5min → removidos
 - Rate limiting: Max 1 ataque por segundo por player
 - Logging: Todas as jogadas logadas com timestamps + assinaturas (audit trail)

 Clientes:

 - Socket.io auto-reconnect (built-in)
 - UI states: "Reconectando...", "Oponente desconectou"
 - Restore match state após reconexão (servidor envia snapshot)

 ---
 Arquivos Críticos

 Arquivo: backend/src/server.ts
 Ação: Modificar: adicionar Socket.io ao httpServer
 ────────────────────────────────────────
 Arquivo: backend/src/app.ts
 Ação: Modificar: separar app do listen
 ────────────────────────────────────────
 Arquivo: backend/src/ws/socket.ts
 Ação: Novo: setup Socket.io + event routing
 ────────────────────────────────────────
 Arquivo: backend/src/auth/verifier.ts
 Ação: Novo: verificação Ed25519
 ────────────────────────────────────────
 Arquivo: backend/src/matchmaking/translator.ts
 Ação: Novo: handlers matchmaking
 ────────────────────────────────────────
 Arquivo: backend/src/matchmaking/interactor.ts
 Ação: Novo: lógica pareamento
 ────────────────────────────────────────
 Arquivo: backend/src/battle/translator.ts
 Ação: Novo: handlers de batalha
 ────────────────────────────────────────
 Arquivo: backend/src/battle/interactor.ts
 Ação: Novo: lógica turnos + win
 ────────────────────────────────────────
 Arquivo: backend/src/battle/entities.ts
 Ação: Novo: tipos MatchRoom, Attack
 ────────────────────────────────────────
 Arquivo: web/src/pvp/*.ts
 Ação: Novo: domínio PvP (4 arquivos)
 ────────────────────────────────────────
 Arquivo: web/src/pages/PvpLobby.tsx
 Ação: Modificar: socket real
 ────────────────────────────────────────
 Arquivo: web/src/pages/PvpFriend.tsx
 Ação: Modificar: socket real
 ────────────────────────────────────────
 Arquivo: web/src/pages/Placement.tsx
 Ação: Modificar: submitPlacement PvP
 ────────────────────────────────────────
 Arquivo: web/src/pages/Battle.tsx
 Ação: Modificar: turnos PvP via socket
 ────────────────────────────────────────
 Arquivo: mobile/src/pvp/*.ts
 Ação: Novo: domínio PvP mobile
 ────────────────────────────────────────
 Arquivo: mobile/app/pvp-lobby.tsx
 Ação: Modificar: socket real
 ────────────────────────────────────────
 Arquivo: mobile/app/pvp-friend.tsx
 Ação: Modificar: socket real
 ────────────────────────────────────────
 Arquivo: mobile/app/placement.tsx
 Ação: Modificar: submitPlacement PvP
 ────────────────────────────────────────
 Arquivo: mobile/app/battle.tsx
 Ação: Modificar: turnos PvP via socket

 Ordem de Execução

 Bloco 1 (WebSocket + Auth)     → base de tudo
 Bloco 2 (Matchmaking)          → depende do 1
 Bloco 3 (Game Flow)            → depende do 2
 Bloco 4 (Assinaturas)          → depende do 1, paralelo com 2-3
 Bloco 5 (Web)                  → depende do 3
 Bloco 6 (Mobile)               → depende do 3, paralelo com 5
 Bloco 7 (Resiliência)          → depende de 5+6

 Verificação Final

 1. Unit: Testar interactors de matchmaking e battle isolados
 2. Integration: 2 clientes web jogando partida completa
 3. Cross-platform: 1 web + 1 mobile jogando partida completa
 4. Security: Enviar proof inválida → cheater perde; assinatura inválida →
 rejeitado
 5. Timeout: Player não responde em 30s → auto-forfeit
 6. Reconexão: Desconectar e reconectar durante partida → match continua
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌