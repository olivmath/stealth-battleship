# ZK Pipeline — Dev & Runtime

## Conceito

Dois circuitos Noir representam as regras do jogo. Cada etapa (placement e cada tiro) gera uma prova criptografica verificavel. Ninguem trapaceia, nenhum board e revelado.

- `board_validity` — prova que o tabuleiro e legitimo sem revelar posicoes
- `shot_result` — prova que cada hit/miss e honesto contra o board commitado

---

## 1. Pipeline de Desenvolvimento (Dev Time)

```
WRITE (.nr) → COMPILE (nargo) → BUNDLE (json no app) → NATIVE BINDINGS (provar no device)
```

### Step 1: Escrever o circuito Noir

```bash
nargo new board_validity
```

```noir
// board_validity/src/main.nr
fn main(
    ship_positions: [(u8, u8, u8, u8)],  // private
    nonce: Field,                          // private
    board_hash: pub Field,                 // public
    grid_size: pub u8                      // public
) {
    // constraints: bounds, overlaps, hash match...
}
```

### Step 2: Compilar

```bash
nargo compile
```

Gera `target/board_validity.json`:
- **ACIR** — bytecode do circuito (backend-agnostic)
- **ABI** — schema dos inputs (private vs public, tipos)

### Step 3: Testar

```bash
nargo check     # gera Prover.toml com stubs
nargo execute   # roda circuito, gera witness
nargo test      # testes unitarios
```

### Step 4: Integrar no React Native

WASM NAO funciona no Hermes (engine JS do RN). Caminhos viaveis:

| Abordagem | Como | Performance |
|-----------|------|-------------|
| **noir-react-native-starter** (recomendado) | Native bindings: Swoir (iOS) + noir_android (Android) | ~2-5s |
| **Mopro** | Barretenberg em Rust → uniffi → Swift/Kotlin | ~2.6s iPhone 16 |
| **WebView** (fallback) | NoirJS + bb.js dentro de WebView | ~37s (lento) |

Empacota `circuit.json` + SRS no app. Modulo nativo expoe:
- `setupCircuit(path)` → circuitId
- `generateProof(circuitId, inputs)` → proof
- `verifyProof(circuitId, proof)` → boolean

### Stack de camadas

```
App (RN/Expo)
    ↓ inputs
noir_js  →  executa circuito  →  witness
    ↓ witness + ACIR
Barretenberg (UltraHonk)  →  prova criptografica
    ↓ proof
Convex (server)  →  verifica prova
```

---

## 2. Pipeline de Runtime (Game Flow)

### Fase 1 — Placement

```
Player monta tabuleiro (drag & drop)
    ↓
serialize(ships) + random nonce
    ↓
Noir execute(ships, nonce, grid_size) → witness
    ↓
generateProof(witness) → proof + board_hash     [~2-5s "Securing your fleet..."]
    ↓
submit_placement(board_hash, proof) → Convex
    ↓
Convex verifyProof(proof) ✓ → placement_accepted
```

```typescript
// Serializa board
const boardData = serializeShips(ships);
const nonce = randomField();

// Executa circuito (gera witness)
const { witness } = await noir.execute({
  ship_positions: boardData,  // PRIVATE — nunca sai do device
  nonce: nonce,               // PRIVATE
  board_hash: poseidon(boardData, nonce),  // PUBLIC
  grid_size: 6                // PUBLIC
});

// Gera prova
const proof = await backend.generateProof(witness);

// Envia
await convex.mutation("submit_placement", {
  matchId,
  boardHash: proof.publicInputs.board_hash,
  proof: proof.bytes
});
```

### Fase 2 — Battle (cada turno)

```
Convex envia attack_incoming(row, col)
    ↓
App checa localmente: hit ou miss?
    ↓
Noir execute(ships, nonce, board_hash, row, col, is_hit) → witness
    ↓
generateProof(witness) → proof     [~1-2s durante animacao]
    ↓
submit_result(hit/miss, proof) → Convex
    ↓
Convex verifyProof(proof) ✓ → turn_confirmed
```

```typescript
const isHit = checkCell(myShips, 3, 4);

const { witness } = await noir.execute({
  ship_positions: boardData,
  nonce: nonce,
  board_hash: myBoardHash,    // deve bater com o commitado
  shot_row: 3,
  shot_col: 4,
  is_hit: isHit
});

const proof = await backend.generateProof(witness);
await convex.mutation("submit_result", { matchId, result: isHit, proof });
```

---

## Resumo

**Dev:** `.nr` → `nargo compile` → empacota JSON no app → native bindings para provar

**Runtime:** monta board → prova validade (sem revelar) → a cada tiro prova honestidade → server verifica → ninguem trapaceia

---

## Compatibilidade de Versoes

| Componente | Versao |
|---|---|
| Noir | 1.0.0-beta.8 ~ beta.15 |
| Nargo | = Noir version |
| `@noir-lang/noir_js` | 1.0.0-beta.15 |
| `@aztec/bb.js` | 3.0.0-nightly |
| Barretenberg (nativo/Mopro) | 1.0.0-nightly.20250723 |
| Proof system | UltraHonk |

## Referencias

- [noir-react-native-starter](https://github.com/madztheo/noir-react-native-starter)
- [Mopro — Mobile ZK Proofs](https://zkmopro.org/)
- [BattleZips-Noir](https://github.com/BattleZips/BattleZips-Noir)
- [NoirJS Tutorial](https://noir-lang.org/docs/tutorials/noirjs_app/)
- [Nargo CLI](https://noir-lang.org/docs/reference/nargo_commands)
