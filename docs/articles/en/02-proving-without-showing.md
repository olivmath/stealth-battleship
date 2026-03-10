# Devlog: ZK Battleship

## Part 2 — "Proving without showing"

*Writing ZK circuits in Noir, choosing Poseidon2, and discovering that the beautiful mobile app can't run proofs*

---

### February 21st: time to actually learn ZK

The single-player game was ready. Beautiful, playable, with 14 screens and animations. But so far there wasn't a single line of ZK code. The hackathon closed in 2 days. It was time to dive in.

My first problem: **how do you write a zero-knowledge proof?**

You don't write the proof directly. You write a **circuit** — a program that describes the rules the proof must satisfy. Then, a mathematical tool generates the proof from the circuit and the input data.

Think of it this way: the circuit is the contract. The proof is the signature. Whoever verifies the proof is confirming that someone executed the circuit correctly with valid inputs, without seeing what the inputs were.

---

### Noir: the language of circuits

There are several languages for writing ZK circuits: Circom, Cairo, Noir, among others. I chose **Noir** (by Aztec) for three reasons:

1. The syntax looks like Rust — familiar enough that I didn't have to learn an alien language
2. It has a modern toolchain: `nargo` for compiling and testing, `bb.js` for generating proofs in JavaScript
3. The proof system (UltraHonk) is compatible with the BN254 curve — the same one Stellar's Protocol 25 natively supports

Installation is straightforward:

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup -v 1.0.0-beta.9
```

---

### The first circuit: board_validity

The most important circuit is the first one: proving that your board is valid without revealing where the ships are.

What it needs to verify:
1. The ships have the correct sizes (5, 4, 3, 3, 2)
2. No ship goes out of the 10x10 board bounds
3. No ship overlaps another
4. The board hash matches a public commitment

Here's the actual circuit, in Noir:

```noir
use poseidon::poseidon2::Poseidon2;

fn main(
    ships: [(u8, u8, u8, bool); 5],      // secret ship positions
    nonce: Field,                          // secret random number
    board_hash: pub Field,                 // public commitment
    ship_sizes: pub [u8; 5],              // expected sizes (public)
) {
    // 1. Does the hash match?
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "invalid board hash");

    // 2. Correct sizes?
    for i in 0..5 {
        let (_, _, size, _) = ships[i];
        assert(size == ship_sizes[i], "invalid ship size");
    }

    // 3. Within bounds?
    for i in 0..5 {
        let (row, col, size, horizontal) = ships[i];
        assert(ship_in_bounds(row, col, size, horizontal));
    }

    // 4. No overlap?
    for i in 0..5 {
        for j in (i + 1)..5 {
            assert(!ships_overlap(ships[i], ships[j]));
        }
    }
}
```

Notice the `pub` keyword. Inputs marked with `pub` are **public** — anyone can see them. Inputs without `pub` are **private** — only the proof generator knows them.

`ships` and `nonce` are private: nobody knows where your ships are or what random number you used. `board_hash` and `ship_sizes` are public: everyone can verify that the proof was generated against that specific hash and with those ship sizes.

---

### The hash function: Poseidon2

A detail that seems small but is one of the most important decisions of the project: which hash function to use.

In the normal world, you'd use SHA-256. Secure, tested, ubiquitous. I started with SHA-256 (commit `5253a32`: `feat(crypto): add board commitment types and SHA-256 hashing`). But inside a ZK circuit, SHA-256 is **extremely expensive**. Each bitwise operation becomes thousands of constraints in the circuit, making the proof slow to generate.

**Poseidon2** is a hash function designed specifically for ZK circuits. It operates over finite fields (the natural numbers of circuits) instead of bits, making it orders of magnitude more efficient inside a circuit.

```noir
fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 5],
    nonce: Field
) -> Field {
    let mut inputs: [Field; 21] = [0; 21];
    for i in 0..5 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;    // row
        inputs[i * 4 + 1] = c as Field;    // column
        inputs[i * 4 + 2] = s as Field;    // size
        inputs[i * 4 + 3] = if h { 1 } else { 0 }; // orientation
    }
    inputs[20] = nonce;  // random salt
    Poseidon2::hash(inputs, 21)
}
```

5 ships x 4 fields each = 20 inputs, plus 1 nonce = 21 values. Poseidon2 compresses everything into a single `Field` (a 254-bit number). That's the public commitment of the board.

The `nonce` is crucial: without it, someone could try all possible board combinations and compare against the public hash. The nonce makes this impossible — it's a random salt that only you know.

And here's the bonus: Stellar implemented Poseidon2 as a **native instruction** in Protocol 25. This means that when we verify the hash on-chain, we're not executing smart contract code — we're using a protocol-level operation. Fast and cheap.

---

### The second circuit: shot_proof

With the board committed, we need to prove that each response during the game is honest.

When my opponent attacks coordinate (3, 5) on my board, I say "hit" or "miss". But how do they know I'm not lying?

```noir
fn main(
    ships: [(u8, u8, u8, bool); 5],  // my positions (SECRET)
    nonce: Field,                      // my nonce (SECRET)
    board_hash: pub Field,             // my commitment (PUBLIC)
    row: pub u8,                       // attacked coordinate
    col: pub u8,
    is_hit: pub bool,                  // my response
) {
    // Does the hash match the board I committed at the start?
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "invalid board hash");

    // Is the response consistent with the actual ship positions?
    let actual_hit = cell_is_hit(ships, row, col);
    assert(actual_hit == is_hit, "dishonest result");
}
```

The circuit does two things:
1. Verifies that the hash matches — meaning I'm using the same board from the start
2. Verifies that the response matches reality — if there's a ship in that cell, it has to be "hit"

If I try to lie (say "miss" when there's a ship), the `assert` fails and the proof can't be generated. **Lying is mathematically impossible.**

---

### The third circuit: turns_proof

The final circuit is the most ambitious: replay the entire match and calculate the winner.

```noir
fn main(
    ships_player: [(u8, u8, u8, bool); 5],  // player 1's ships (secret)
    ships_ai: [(u8, u8, u8, bool); 5],      // player 2's ships (secret)
    nonce_player: Field,
    nonce_ai: Field,
    board_hash_player: pub Field,
    board_hash_ai: pub Field,
    attacks_player: pub [(u8, u8); 100],     // all P1 attacks
    attacks_ai: pub [(u8, u8); 100],         // all P2 attacks
    n_attacks_player: pub u8,
    n_attacks_ai: pub u8,
    ship_sizes: pub [u8; 5],
    winner: pub u8,                           // 0 = P1, 1 = P2
) {
    // Verify both boards
    assert(compute_board_hash(ships_player, nonce_player) == board_hash_player);
    assert(compute_board_hash(ships_ai, nonce_ai) == board_hash_ai);

    // Count hits on each board
    let mut hits_on_ai: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_player {
            let (row, col) = attacks_player[i];
            if cell_is_hit(ships_ai, row, col) {
                hits_on_ai += 1;
            }
        }
    }

    let mut hits_on_player: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_ai {
            let (row, col) = attacks_ai[i];
            if cell_is_hit(ships_player, row, col) {
                hits_on_player += 1;
            }
        }
    }

    // Did the declared winner actually win?
    let cells_to_win = total_ship_cells(ship_sizes); // 5+4+3+3+2 = 17
    if winner == 0 {
        assert(hits_on_ai == cells_to_win);   // P1 sunk all of P2's ships
    } else {
        assert(hits_on_player == cells_to_win); // P2 sunk all of P1's ships
    }
}
```

This circuit is the final referee. It receives the entire match history — all attacks from both players — and recalculates who won. If someone tries to declare the wrong winner, the proof fails.

The 100-attack array is fixed (ZK circuits don't support variable-length arrays). Unused slots are filled with `(0, 0)` and ignored via the `n_attacks` counter.

---

### Testing the circuits

Noir has built-in test support. Each circuit includes tests that verify valid and invalid scenarios:

```noir
#[test]
fn test_valid_board() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 0, 5, true),   // Carrier on row 0, horizontal
        (2, 0, 4, true),   // Battleship on row 2
        (4, 0, 3, true),   // Cruiser on row 4
        (6, 0, 3, true),   // Submarine on row 6
        (8, 0, 2, true),   // Destroyer on row 8
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];
    main(ships, nonce, board_hash, ship_sizes); // should not fail
}

#[test(should_fail)]
fn test_lying_miss_when_hit() {
    // Trying to say "miss" on a cell that has a ship
    main(ships, nonce, board_hash, 0, 0, false); // MUST fail
}
```

```bash
nargo test
```

All passing. The circuits work. Now I need to generate real proofs.

---

### Generating proofs: bb.js and the React Native problem

To generate a proof from a Noir circuit, you need two components:

1. **NoirJS** (`@noir-lang/noir_js`): executes the circuit and generates the "witness" (the intermediate values)
2. **bb.js** (`@aztec/bb.js`): takes the witness and generates the cryptographic proof using UltraHonk

On Node.js, it works perfectly:

```typescript
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

const circuit = JSON.parse(fs.readFileSync('board_validity.json', 'utf-8'));
const backend = new UltraHonkBackend(circuit.bytecode);
const noir = new Noir(circuit);

// Generate witness (execute the circuit with inputs)
const { witness } = await noir.execute({
    ships: [[0, 0, 5, true], [2, 0, 4, true], ...],
    nonce: "12345",
    board_hash: "0x07488bfc...",
    ship_sizes: [5, 4, 3, 3, 2],
});

// Generate proof
const proof = await backend.generateProof(witness, { keccak: true });
// proof.proof: Uint8Array of 14592 bytes
```

The `{ keccak: true }` flag is important — it generates proofs compatible with on-chain verification.

On the backend (Node.js), this worked on the first try. But the plan was to generate proofs **on the client** — on the mobile app. The player places their ships, the app generates the proof locally, and sends only the proof to the backend (never the positions).

And here the nightmare began.

---

### The wall: bb.js on React Native

`bb.js` uses **heavy WebAssembly**. It loads megabytes of binaries to perform cryptographic operations. On Node.js and the browser, this works because both have mature WASM support. But React Native...

React Native doesn't run in a browser. It runs on its own JavaScript runtime (Hermes or JSC) that doesn't have full WebAssembly support. `bb.js` needs WASM threads, shared memory, and APIs that simply don't exist in the React Native runtime.

I tried several approaches:

**Attempt 1: import bb.js directly in React Native.**
Failed immediately. `WebAssembly` doesn't exist in Hermes.

**Attempt 2: invisible WebView.**
The idea: create a hidden `<WebView>` that loads an HTML page with bb.js, and communicate via `postMessage`. The WebView runs on a real browser engine, so WASM works.

```typescript
// zk/adapter.tsx — WebView provider
<WebView
    source={{ html: zkWorkerHtml }}
    onMessage={(event) => {
        const result = JSON.parse(event.nativeEvent.data);
        // proof generated!
    }}
/>
```

This almost worked. But the proofs took too long — the WebView has memory and CPU limitations. And communication via `postMessage` added latency. In tests, generating a `board_validity` proof took over 30 seconds on a phone. Unfeasible for a game.

**Attempt 3: version downgrade.**
Maybe an older version of bb.js would be lighter? Commit `e78a543`: `fix(backend): downgrade bb.js and noir_js to compatible versions`. Tested bb.js 0.72.1 with noir_js beta.2. Still didn't run on React Native.

---

### The painful decision

I looked at the mobile app. 14 screens. Reanimated animations. Haptics. Internationalization in 3 languages. Animated splash screen, 3D ship model in the menu, confetti on victory. A beautiful app that took days to polish.

And I looked at bb.js refusing to run on it.

The decision: **abandon mobile-only and build a web client.**

Web (Vite + React) runs on a real browser. WASM works. bb.js works. Everything works. It wouldn't be as beautiful as the native app, but it would be functional.

Commit `f63324b`: `feat(web): merge wallet creation into login flow`. The web client started to take shape, mirroring the mobile's features but with the critical advantage of being able to generate ZK proofs.

The mobile app continued to exist — for single-player and as a visual reference. But PvP with ZK would be web-only.

---

### The lesson here

If I could go back in time, I would have tested bb.js on React Native on **day one**. Before building 14 screens. Before polishing animations. The riskiest integration of the project should have been tested first.

But it's easy to say that in hindsight. At the time, the single-player game was pure motivation — seeing something working, beautiful, playable. And that motivation carried me to the point where ZK needed to work.

---

### What we have so far

At the end of this phase:

- 3 Noir circuits compiled and tested (`board_validity`, `shot_proof`, `turns_proof`)
- Poseidon2 as hash function (compatible with Stellar Protocol 25)
- Proofs generating on Node.js and browser (bb.js + NoirJS)
- Beautiful mobile app but without ZK
- Functional web client with proof generation

The circuits were ready. The proofs were being generated. But nobody was **verifying** them yet — neither the backend nor the blockchain.

That's the next chapter.

---

*Previous: [Part 1 — "The Hackathon"](./01-logbook.md)*
*Next: [Part 3 — "The blockchain that verified the proof"](./03-proofs-onchain.md)*
