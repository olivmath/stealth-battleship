# Soroban Contracts Redesign — ZK Template + Stake

**Data:** 2026-03-09
**Status:** Aprovado

## Contexto

Contratos atuais têm:
- Bug no `verify_board()` (não propaga erro)
- GameHub hardcoded (desnecessário)
- Admin redundante no verifier
- TTL magic number
- Sem lógica de stake/tokens

## Decisões

- **Stake model**: cada player deposita XLM ao abrir match, vencedor leva pool
- **Coordenação off-chain**: backend faz matchmaking via Socket.io, orquestra tx on-chain
- **Sem estado "waiting"**: match abre com ambos players confirmados na mesma tx
- **2 verificações ZK em 1 tx**: inviável (UltraHonk estoura budget CPU do Soroban)
- **Qualquer um pode abrir/fechar match** (sem admin gate), exceto cancel (admin-only)
- **Substitui trustline BATTLE token** do backend (`payment/stellar-asset.ts`)

## Verifier Contract (cleanup)

- Remover parâmetro `admin` redundante de `set_verification_key` — carregar do storage
- Extrair TTL como constante: `const PROOF_TTL: u32 = 518_400`
- Sem mudanças conceituais — continua genérico como template

## Battleship Contract (rewrite)

### Remover
- GameHub trait, client, storage key, todas as chamadas cross-contract ao GameHub
- Admin gate em `open_match` e `close_match`

### Adicionar
- Token SAC no constructor: `__constructor(admin, verifier, token)`
- Stake escrow via `token::Client` (XLM nativo)

### Funções

```rust
open_match(p1: Address, p2: Address, stake: i128) -> Result<u32, Error>
```
- `p1.require_auth()`, `p2.require_auth()`
- Transfere `stake` de cada player pro contrato via SAC
- Cria `MatchState { player1, player2, stake_amount, open_tx_ledger, closed }`
- Retorna `session_id`

```rust
close_match(session_id: u32, proof: Bytes, pub_inputs: Bytes, winner: Address) -> Result<(), Error>
```
- Valida `winner` é `player1` ou `player2`
- Verifica `turns_proof` via Verifier cross-contract (com `?` propagando erro)
- Transfere `stake * 2` pro winner via SAC
- Marca match como closed

```rust
cancel_match(session_id: u32) -> Result<(), Error>
```
- Admin-only
- Match não pode estar closed
- Devolve `stake` para cada player via SAC

```rust
verify_board(proof: Bytes, pub_inputs: Bytes) -> Result<bool, Error>
```
- Corrigir: adicionar `?` na chamada cross-contract ao Verifier

```rust
get_match(session_id: u32) -> Result<MatchState, Error>
get_session_counter() -> u32
```
- Sem mudanças

### MatchState

```rust
struct MatchState {
    player1: Address,
    player2: Address,
    stake_amount: i128,
    open_tx_ledger: u32,
    closed: bool,
}
```

### Erros

```rust
enum Error {
    NotAdmin = 1,
    VerificationFailed = 2,
    MatchNotFound = 3,
    MatchAlreadyClosed = 4,
    InvalidWinner = 5,
    InsufficientStake = 6,
}
```

## Deploy Script

- Remover `GAME_HUB` hardcoded
- Adicionar `TOKEN_ADDRESS` (SAC do XLM nativo na testnet)
- Constructor do battleship: `--admin --verifier --token`
- Remover `--game_hub` do deploy

## Impacto no Backend

- `soroban/adapter.ts`: atualizar `openMatchOnChain` e `closeMatchOnChain` com novos params
- `payment/stellar-asset.ts`: pode ser removido (trustline BATTLE substituído por stake on-chain)
- `payment/interactor.ts`: simplificar — não precisa mais de memo/stream/issuance
