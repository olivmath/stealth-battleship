# Bloco 1 — Noir Circuits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Escrever e testar os 3 circuitos Noir (`board_validity`, `shot_proof`, `turns_proof`) usando TDD com `nargo test`.

**Architecture:** Cada circuit é um projeto Noir independente em `circuits/<name>/`. Os testes ficam no próprio `.nr` usando `#[test]`. Compilar com `nargo compile` gera o JSON (ACIR + ABI) que será usado pelo zkService no Bloco 2.

**Tech Stack:** Noir (nargo CLI), Poseidon hash (nativo no Noir via `std::hash::poseidon`)

---

## Pré-requisito: Instalar nargo

**Step 1: Instalar noirup**

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
```

**Step 2: Instalar nargo (versão estável)**

```bash
noirup
```

**Step 3: Verificar instalação**

```bash
nargo --version
```

Expected: `nargo version = X.X.X`

**Step 4: Commit do lock de versão**

```bash
# Anotar versão instalada — será usada em todos os circuits
nargo --version > circuits/.nargo-version
git add circuits/.nargo-version
git commit -m "chore: pin nargo version"
```

---

## Task 1 (E1): Circuit `board_validity`

Prova que um tabuleiro 6x6 tem navios válidos (tamanho, limites, sem sobreposição) sem revelar as posições.

**Files:**
- Create: `circuits/board_validity/src/main.nr`
- Create: `circuits/board_validity/Nargo.toml`

---

**Step 1: Scaffold do projeto**

```bash
cd circuits
nargo new board_validity
```

Gera:
```
circuits/board_validity/
├── Nargo.toml
└── src/
    └── main.nr
```

**Step 2: Configurar Nargo.toml**

```toml
[package]
name = "board_validity"
type = "bin"
authors = [""]
compiler_version = ">=0.36.0"

[dependencies]
```

**Step 3: Escrever os testes primeiro (TDD)**

Substituir o conteúdo de `circuits/board_validity/src/main.nr`:

```noir
use std::hash::poseidon2;

// Verifica se um navio cabe dentro do grid 6x6
fn ship_in_bounds(row: u8, col: u8, size: u8, horizontal: bool) -> bool {
    if horizontal {
        (row < 6) & (col + size <= 6)
    } else {
        (col < 6) & (row + size <= 6)
    }
}

// Verifica se dois navios se sobrepõem
fn ships_overlap(
    r1: u8, c1: u8, s1: u8, h1: bool,
    r2: u8, c2: u8, s2: u8, h2: bool,
) -> bool {
    // Verifica célula a célula
    let mut overlap = false;
    for i in 0..5_u8 {
        if i < s1 {
            let (ship1_r, ship1_c) = if h1 { (r1, c1 + i) } else { (r1 + i, c1) };
            for j in 0..5_u8 {
                if j < s2 {
                    let (ship2_r, ship2_c) = if h2 { (r2, c2 + j) } else { (r2 + j, c2) };
                    if (ship1_r == ship2_r) & (ship1_c == ship2_c) {
                        overlap = true;
                    }
                }
            }
        }
    }
    overlap
}

// Calcula hash do board (usa posições dos navios + nonce)
fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 3],
    nonce: Field,
) -> Field {
    // Flatten ships para array de Fields
    let mut inputs: [Field; 13] = [0; 13];
    for i in 0..3 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;
        inputs[i * 4 + 1] = c as Field;
        inputs[i * 4 + 2] = s as Field;
        inputs[i * 4 + 3] = if h { 1 } else { 0 };
    }
    inputs[12] = nonce;
    poseidon2::Poseidon2::hash(inputs, 13)
}

// Circuit principal
fn main(
    // Private inputs
    ships: [(u8, u8, u8, bool); 3],  // (row, col, size, horizontal)
    nonce: Field,
    // Public inputs
    board_hash: pub Field,
    ship_sizes: pub [u8; 3],          // tamanhos esperados ex: [2, 2, 3]
) {
    // 1. Verificar hash
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash inválido");

    // 2. Verificar tamanhos dos navios
    for i in 0..3 {
        let (_, _, size, _) = ships[i];
        assert(size == ship_sizes[i], "tamanho de navio inválido");
    }

    // 3. Verificar limites do grid
    for i in 0..3 {
        let (row, col, size, horizontal) = ships[i];
        assert(ship_in_bounds(row, col, size, horizontal), "navio fora dos limites");
    }

    // 4. Verificar sem sobreposição (pares: 0-1, 0-2, 1-2)
    let (r0, c0, s0, h0) = ships[0];
    let (r1, c1, s1, h1) = ships[1];
    let (r2, c2, s2, h2) = ships[2];

    assert(!ships_overlap(r0, c0, s0, h0, r1, c1, s1, h1), "navios 0 e 1 se sobrepõem");
    assert(!ships_overlap(r0, c0, s0, h0, r2, c2, s2, h2), "navios 0 e 2 se sobrepõem");
    assert(!ships_overlap(r1, c1, s1, h1, r2, c2, s2, h2), "navios 1 e 2 se sobrepõem");
}

// ---- TESTES ----

#[test]
fn test_valid_board() {
    // 3 navios válidos: patrol(2) em (0,0) horizontal,
    //                   patrol(2) em (2,0) horizontal,
    //                   destroyer(3) em (4,0) horizontal
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 3];

    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_wrong_hash() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let wrong_hash: Field = 99999;
    let ship_sizes: [u8; 3] = [2, 2, 3];

    main(ships, nonce, wrong_hash, ship_sizes);
}

#[test(should_fail)]
fn test_ship_out_of_bounds() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 5, 2, true),  // col 5 + size 2 = 7 > 6 → inválido
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 3];

    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_ships_overlap() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (0, 1, 2, true),  // sobrepõe com o navio 0
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 3];

    main(ships, nonce, board_hash, ship_sizes);
}

#[test(should_fail)]
fn test_wrong_ship_size() {
    let ships: [(u8, u8, u8, bool); 3] = [
        (0, 0, 2, true),
        (2, 0, 2, true),
        (4, 0, 3, true),
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 3] = [2, 2, 4]; // destroyer deveria ser 3, não 4

    main(ships, nonce, board_hash, ship_sizes);
}
```

**Step 4: Rodar testes (devem passar)**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk/circuits/board_validity
nargo test
```

Expected:
```
[board_validity] Testing 5 test functions
[board_validity] test test_valid_board ... ok
[board_validity] test test_wrong_hash ... ok (should_fail)
[board_validity] test test_ship_out_of_bounds ... ok (should_fail)
[board_validity] test test_ships_overlap ... ok (should_fail)
[board_validity] test test_wrong_ship_size ... ok (should_fail)
5 tests passed
```

**Step 5: Compilar**

```bash
nargo compile
```

Expected: gera `circuits/board_validity/target/board_validity.json`

**Step 6: Commit**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk
git add circuits/board_validity/
git commit -m "feat(circuits): add board_validity circuit with tests"
```

---

## Task 2 (E2): Circuit `shot_proof`

Prova que a resposta (hit/miss) de um ataque em (row, col) é honesta contra o tabuleiro commitado.

**Files:**
- Create: `circuits/shot_proof/src/main.nr`
- Create: `circuits/shot_proof/Nargo.toml`

---

**Step 1: Scaffold**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk/circuits
nargo new shot_proof
```

**Step 2: Configurar Nargo.toml**

```toml
[package]
name = "shot_proof"
type = "bin"
authors = [""]
compiler_version = ">=0.36.0"

[dependencies]
```

**Step 3: Escrever circuit + testes**

`circuits/shot_proof/src/main.nr`:

```noir
use std::hash::poseidon2;

// Mesma função de hash do board_validity
fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 3],
    nonce: Field,
) -> Field {
    let mut inputs: [Field; 13] = [0; 13];
    for i in 0..3 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;
        inputs[i * 4 + 1] = c as Field;
        inputs[i * 4 + 2] = s as Field;
        inputs[i * 4 + 3] = if h { 1 } else { 0 };
    }
    inputs[12] = nonce;
    poseidon2::Poseidon2::hash(inputs, 13)
}

// Verifica se célula (row, col) é ocupada por algum navio
fn cell_is_hit(ships: [(u8, u8, u8, bool); 3], row: u8, col: u8) -> bool {
    let mut hit = false;
    for i in 0..3 {
        let (r, c, s, h) = ships[i];
        for j in 0..5_u8 {
            if j < s {
                let (ship_r, ship_c) = if h { (r, c + j) } else { (r + j, c) };
                if (ship_r == row) & (ship_c == col) {
                    hit = true;
                }
            }
        }
    }
    hit
}

// Circuit principal
fn main(
    // Private inputs
    ships: [(u8, u8, u8, bool); 3],
    nonce: Field,
    // Public inputs
    board_hash: pub Field,
    row: pub u8,
    col: pub u8,
    is_hit: pub bool,
) {
    // 1. Verificar hash — garante que o board não mudou
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash inválido");

    // 2. Verificar honestidade do resultado
    let actual_hit = cell_is_hit(ships, row, col);
    assert(actual_hit == is_hit, "resultado desonesto");
}

// ---- TESTES ----

// Board de teste: patrol(2) em (0,0) H, patrol(2) em (2,0) H, destroyer(3) em (4,0) H
fn test_ships() -> [(u8, u8, u8, bool); 3] {
    [(0, 0, 2, true), (2, 0, 2, true), (4, 0, 3, true)]
}

#[test]
fn test_hit() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);

    // (0,0) é o início do primeiro patrol → hit
    main(ships, nonce, board_hash, 0, 0, true);
}

#[test]
fn test_miss() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);

    // (1,0) está vazio → miss
    main(ships, nonce, board_hash, 1, 0, false);
}

#[test(should_fail)]
fn test_lying_miss_when_hit() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);

    // (0,0) é hit mas declaramos miss → deve falhar
    main(ships, nonce, board_hash, 0, 0, false);
}

#[test(should_fail)]
fn test_lying_hit_when_miss() {
    let ships = test_ships();
    let nonce: Field = 42;
    let board_hash = compute_board_hash(ships, nonce);

    // (1,0) é miss mas declaramos hit → deve falhar
    main(ships, nonce, board_hash, 1, 0, true);
}

#[test(should_fail)]
fn test_wrong_board_hash() {
    let ships = test_ships();
    let nonce: Field = 42;
    let wrong_hash: Field = 0;

    main(ships, nonce, wrong_hash, 0, 0, true);
}
```

**Step 4: Rodar testes**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk/circuits/shot_proof
nargo test
```

Expected: `5 tests passed`

**Step 5: Compilar**

```bash
nargo compile
```

Expected: `circuits/shot_proof/target/shot_proof.json`

**Step 6: Commit**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk
git add circuits/shot_proof/
git commit -m "feat(circuits): add shot_proof circuit with tests"
```

---

## Task 3 (E3): Circuit `turns_proof`

Prova quem ganhou o jogo dado os dois tabuleiros privados e todos os ataques de ambos os lados.

**Files:**
- Create: `circuits/turns_proof/src/main.nr`
- Create: `circuits/turns_proof/Nargo.toml`

---

**Step 1: Scaffold**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk/circuits
nargo new turns_proof
```

**Step 2: Configurar Nargo.toml**

```toml
[package]
name = "turns_proof"
type = "bin"
authors = [""]
compiler_version = ">=0.36.0"

[dependencies]
```

**Step 3: Escrever circuit + testes**

`circuits/turns_proof/src/main.nr`:

```noir
use std::hash::poseidon2;

global MAX_ATTACKS: u32 = 36; // máximo de ataques (6x6 = 36 células)

fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 3],
    nonce: Field,
) -> Field {
    let mut inputs: [Field; 13] = [0; 13];
    for i in 0..3 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;
        inputs[i * 4 + 1] = c as Field;
        inputs[i * 4 + 2] = s as Field;
        inputs[i * 4 + 3] = if h { 1 } else { 0 };
    }
    inputs[12] = nonce;
    poseidon2::Poseidon2::hash(inputs, 13)
}

fn cell_is_hit(ships: [(u8, u8, u8, bool); 3], row: u8, col: u8) -> bool {
    let mut hit = false;
    for i in 0..3 {
        let (r, c, s, h) = ships[i];
        for j in 0..5_u8 {
            if j < s {
                let (ship_r, ship_c) = if h { (r, c + j) } else { (r + j, c) };
                if (ship_r == row) & (ship_c == col) {
                    hit = true;
                }
            }
        }
    }
    hit
}

// Total de células ocupadas pelos navios (2 + 2 + 3 = 7)
fn total_ship_cells(ship_sizes: [u8; 3]) -> u8 {
    ship_sizes[0] + ship_sizes[1] + ship_sizes[2]
}

// Circuit principal
fn main(
    // Private inputs
    ships_player: [(u8, u8, u8, bool); 3],
    ships_ai: [(u8, u8, u8, bool); 3],
    nonce_player: Field,
    nonce_ai: Field,
    // Public inputs
    board_hash_player: pub Field,
    board_hash_ai: pub Field,
    attacks_player: pub [(u8, u8); 36],  // ataques do player no AI (padded com zeros)
    attacks_ai: pub [(u8, u8); 36],      // ataques da AI no player (padded com zeros)
    n_attacks_player: pub u8,            // quantos ataques reais do player
    n_attacks_ai: pub u8,                // quantos ataques reais da AI
    ship_sizes: pub [u8; 3],             // [2, 2, 3]
    winner: pub u8,                      // 0 = player ganhou, 1 = AI ganhou
) {
    // 1. Verificar hashes
    assert(
        compute_board_hash(ships_player, nonce_player) == board_hash_player,
        "hash do player inválido"
    );
    assert(
        compute_board_hash(ships_ai, nonce_ai) == board_hash_ai,
        "hash da AI inválido"
    );

    // 2. Contar hits do player no tabuleiro da AI
    let mut hits_on_ai: u8 = 0;
    for i in 0..36 {
        if (i as u8) < n_attacks_player {
            let (row, col) = attacks_player[i];
            if cell_is_hit(ships_ai, row, col) {
                hits_on_ai += 1;
            }
        }
    }

    // 3. Contar hits da AI no tabuleiro do player
    let mut hits_on_player: u8 = 0;
    for i in 0..36 {
        if (i as u8) < n_attacks_ai {
            let (row, col) = attacks_ai[i];
            if cell_is_hit(ships_player, row, col) {
                hits_on_player += 1;
            }
        }
    }

    // 4. Verificar vencedor
    let cells_to_win = total_ship_cells(ship_sizes);
    let player_won = hits_on_ai == cells_to_win;
    let ai_won = hits_on_player == cells_to_win;

    if winner == 0 {
        assert(player_won, "player declarado vencedor mas não afundou todos os navios da AI");
    } else {
        assert(ai_won, "AI declarada vencedora mas não afundou todos os navios do player");
    }
}

// ---- TESTES ----

fn player_ships() -> [(u8, u8, u8, bool); 3] {
    [(0, 0, 2, true), (2, 0, 2, true), (4, 0, 3, true)]
}

fn ai_ships() -> [(u8, u8, u8, bool); 3] {
    [(0, 3, 2, true), (2, 3, 2, true), (4, 3, 3, true)]
}

fn empty_attacks() -> [(u8, u8); 36] {
    [(0, 0); 36]
}

#[test]
fn test_player_wins() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p = compute_board_hash(ships_player, nonce_p);
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 3] = [2, 2, 3];

    // Player acerta todas as 7 células da AI
    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 3);
    attacks_p[1] = (0, 4);
    attacks_p[2] = (2, 3);
    attacks_p[3] = (2, 4);
    attacks_p[4] = (4, 3);
    attacks_p[5] = (4, 4);
    attacks_p[6] = (4, 5);

    // AI não afunda todos os navios do player
    let mut attacks_ai = empty_attacks();
    attacks_ai[0] = (0, 0); // 1 hit

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        7, 1,
        ship_sizes,
        0, // player ganhou
    );
}

#[test]
fn test_ai_wins() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p = compute_board_hash(ships_player, nonce_p);
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 3] = [2, 2, 3];

    // AI acerta todas as 7 células do player
    let mut attacks_ai = empty_attacks();
    attacks_ai[0] = (0, 0);
    attacks_ai[1] = (0, 1);
    attacks_ai[2] = (2, 0);
    attacks_ai[3] = (2, 1);
    attacks_ai[4] = (4, 0);
    attacks_ai[5] = (4, 1);
    attacks_ai[6] = (4, 2);

    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 3); // 1 hit

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        1, 7,
        ship_sizes,
        1, // AI ganhou
    );
}

#[test(should_fail)]
fn test_wrong_winner() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p = compute_board_hash(ships_player, nonce_p);
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 3] = [2, 2, 3];

    // Player só deu 1 hit, mas declara que ganhou → deve falhar
    let mut attacks_p = empty_attacks();
    attacks_p[0] = (0, 3);
    let attacks_ai = empty_attacks();

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks_p, attacks_ai,
        1, 0,
        ship_sizes,
        0, // mentira — player não ganhou
    );
}

#[test(should_fail)]
fn test_wrong_hash() {
    let ships_player = player_ships();
    let ships_ai = ai_ships();
    let nonce_p: Field = 11;
    let nonce_ai: Field = 22;
    let hash_p: Field = 999; // errado
    let hash_ai = compute_board_hash(ships_ai, nonce_ai);
    let ship_sizes: [u8; 3] = [2, 2, 3];
    let attacks = empty_attacks();

    main(
        ships_player, ships_ai,
        nonce_p, nonce_ai,
        hash_p, hash_ai,
        attacks, attacks,
        0, 0,
        ship_sizes,
        0,
    );
}
```

**Step 4: Rodar testes**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk/circuits/turns_proof
nargo test
```

Expected: `4 tests passed`

**Step 5: Compilar**

```bash
nargo compile
```

Expected: `circuits/turns_proof/target/turns_proof.json`

**Step 6: Commit**

```bash
cd /Users/olivmath/Documents/dev/battleship-zk
git add circuits/turns_proof/
git commit -m "feat(circuits): add turns_proof circuit with tests"
```

---

## Checklist Final do Bloco 1

- [ ] `nargo test` verde em `board_validity` (5 testes)
- [ ] `nargo test` verde em `shot_proof` (5 testes)
- [ ] `nargo test` verde em `turns_proof` (4 testes)
- [ ] 3 arquivos `target/*.json` gerados (ACIR + ABI)
- [ ] 3 commits feitos

**Próximo passo:** Bloco 2 — ZK Service (integrar NoirJS no frontend usando os JSONs compilados)
