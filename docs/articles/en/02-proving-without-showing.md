# Devlog: ZK Battleship

## Part 2 — "Proving Without Showing"

*>>> ARTICLE HANDWRITTEN WITH GRAMMAR CORRECTIONS BY A.I. <<<*

---

## February 21st: Actually Learning ZK

The single-player game was ready. Beautiful, playable, with 14 screens and animations. But so far there wasn't a single line of ZK code.

**But how do you write a zero-knowledge proof?**

You don't write the Zero-Knowledge Proof (ZKP) directly. You write a circuit. A circuit is a program that describes the rules the proof must satisfy. Then, a mathematical tool uses the circuit along with the input data, both public and private, to generate the Zero-Knowledge Proof — which we'll simply call a proof.

These rules are called **constraints** and will generate a proof of computation. A proof that the code executed correctly without revealing the execution's input data.

---

## Noir: The Language of Circuits

There are several languages for writing ZK circuits: Circom, Cairo, Noir, among others. I chose Noir for three reasons:

1. The syntax is similar to Rust: so I already "knew" how to program.
2. Toolchain: very practical to install, compile, test, and generate proofs.
3. Compatible proof system: Stellar's Protocol 25 is fully compatible with the UltraHonk proof system. (both use the same BN254 elliptic curve and Poseidon2 hash function)

---

## Board Circuit

The most important circuit is the first one: proving that your board is valid without revealing where the ships are.

What it needs to verify:

- Prove that the board being used is the one being proven (public commitment)
- The ships have the correct sizes (5, 4, 3, 3, 2)
- No ship goes out of the 10x10 board bounds
- No ship overlaps another

I modeled the board as a 10x10 matrix and the ships as vectors of type `A[i][j]`.

I modeled the constraints as if/else functions that should break the entire circuit if any failed. This way, either everything is valid or nothing is, making the circuit **atomic**.

And to turn these constraints into code, I used Noir like this:

```rust
use poseidon::poseidon2::Poseidon2;

fn main(
    ships: [(u8, u8, u8, bool); 5],      // Ship coordinates (SECRET)
    nonce: Field,                        // random number (SECRET)
    board_hash: pub Field,               // public commitment
    ship_sizes: pub [u8; 5],             // expected sizes
) {
    // 1. Validate the public commitment
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "invalid board hash");

    // 2. Validate ship sizes
    for i in 0..5 {
        let (_, _, size, _) = ships[i];
        assert(size == ship_sizes[i], "invalid ship size");
    }

    // 3. Validate board bounds
    for i in 0..5 {
        let (row, col, size, horizontal) = ships[i];
        assert(ship_in_bounds(row, col, size, horizontal));
    }

    // 4. Validate ship overlap
    for i in 0..5 {
        for j in (i + 1)..5 {
            assert(!ships_overlap(ships[i], ships[j]));
        }
    }
}
```

Notice the `pub` keyword. Parameters marked with `pub` are public and anyone can see them. Parameters without `pub` are private — only the proof generator knows them.

- `ships`: coordinates of your ships.
- `nonce`: random number to prevent someone from testing all possible board combinations until they find the `board_hash` and discover the actual positions.
- `board_hash` and `ship_sizes`: everyone can verify that the proof was generated against that specific hash and with those ship sizes.

---

## SHA256 vs Poseidon2

A detail that seems small but is one of the most important decisions of the project: which hash function to use.

In the normal world, you'd use SHA-256 for its simplicity and because any programming language has it available natively.

I even started with SHA-256 to speed up the MVP, but inside a ZK circuit, SHA-256 is extremely expensive and slow. Each bitwise operation becomes thousands of constraints after the circuit is compiled, making the proof slow to generate and expensive to verify.

Poseidon2 is a hash function designed specifically for ZK circuits. It operates over finite fields instead of bits, making it orders of magnitude more efficient inside a circuit.

```rust
fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 5],
    nonce: Field
) -> Field {
    let mut inputs: [Field; 21] = [0; 21];
    for i in 0..5 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;             // row
        inputs[i * 4 + 1] = c as Field;             // column
        inputs[i * 4 + 2] = s as Field;             // size
        inputs[i * 4 + 3] = if h { 1 } else { 0 };  // orientation
    }
    inputs[20] = nonce;                             // random salt
    Poseidon2::hash(inputs, 21)
}
```

5 ships × 4 fields each = 20 inputs + 1 nonce = 21 bytes total. Poseidon2 transforms all inputs into a single Field element of 254 bits. This is the public commitment of the board.

The nonce is crucial: without it, someone could try all possible board combinations and compare against the public hash. The nonce makes this impossible — it's a random salt that only you know.

And here's the bonus: Stellar implemented Poseidon2 as a native instruction in Protocol 25. This means that when we verify the hash on-chain, we're not executing smart contract code — we're actually using a native protocol operation. Fast and cheap.

---

## Attack Circuit

> With the board validated, the next problem is ensuring honesty during the match.

Beyond proving the board is valid, we also need to prove that each action during the game is honest.

When my opponent attacks coordinate (3, 5) on my board, I say "hit" or "miss". But how do they know I'm not lying?

I wrote 2 constraints for this proof:

1. The hash I'm using must match the board from the beginning.
2. If there's a ship at that coordinate, I say `true`; if not, `false`.

If I try to lie (say "miss" when they actually "hit" a ship), the circuit fails and the proof cannot be generated. Lying without breaking the proof system's security is mathematically infeasible.

And the code for this looks like:

```rust
fn main(
    ships: [(u8, u8, u8, bool); 5],    // my positions (SECRET)
    nonce: Field,                      // my nonce (SECRET)
    board_hash: pub Field,             // public commitment
    row: pub u8,                       // attacked X coordinate
    col: pub u8,                       // attacked Y coordinate
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

**But wait — why is `is_hit` an input and not a return value from the circuit?**

ZK circuits don't return values. They are constraint systems. This means they only do `assert` — they pass or fail. If the circuit could return the calculated result of `cell_is_hit`, it would have to expose something derived from `ships`, which is private. This would leak information about where the ships are.

In the world of circuits, the pattern is the **inverse** of regular programming:

> You declare the result (`is_hit = true`), and the circuit proves that your declaration is true given the secret data. If your declaration is false, the proof simply cannot be generated because the circuit fails.

---

## Final Match Circuit

> With board validation and individual attack verification solved, what remained was the referee for the entire match.

The final circuit is the most ambitious: replaying the entire match and calculating, step by step, the winner without revealing the boards, in a mathematically verifiable way.

This circuit is the final referee. It receives the entire match history — all attacks from both players — and recalculates who won. If someone tries to declare the wrong winner, the proof fails.

ZK circuits in Noir require arrays to have fixed sizes at compile time. That's why I used an attack array with a fixed size of 100 (which is the maximum for a 10x10 board). Unused slots are filled with `(0, 0)` and ignored via the `n_attacks` counter.

This circuit is the largest, slowest, and most expensive of the three. Even so, the on-chain verification cost on Stellar was only **$0.00032 USD**. This is because it has to run 2 loops to count who hit all of the opponent's ships:

```rust
fn main(
    // Player 1
    ships_player: [(u8, u8, u8, bool); 5],  // player 1's ships (SECRET)
    attacks_player: pub [(u8, u8); 100],    // all player 1's attacks
    board_hash_player: pub Field,
    n_attacks_player: pub u8,
    nonce_player: Field,

    // Player 2 (AI)
    ships_ai: [(u8, u8, u8, bool); 5],      // player 2's ships (SECRET)
    attacks_ai: pub [(u8, u8); 100],        // all player 2's attacks
    board_hash_ai: pub Field,
    n_attacks_ai: pub u8,
    nonce_ai: Field,

    // Match
    ship_sizes: pub [u8; 5],
    winner: pub u8,                         // player 1 or player 2
) {
    // Verify both boards
    assert(compute_board_hash(ships_player, nonce_player) == board_hash_player);
    assert(compute_board_hash(ships_ai, nonce_ai) == board_hash_ai);

    // Count player 1's hits
    let mut hits_on_player: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_ai {
            let (row, col) = attacks_ai[i];
            if cell_is_hit(ships_player, row, col) {
                hits_on_player += 1;
            }
        }
    }

    // Count player 2's (AI) hits
    let mut hits_on_ai: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_player {
            let (row, col) = attacks_player[i];
            if cell_is_hit(ships_ai, row, col) {
                hits_on_ai += 1;
            }
        }
    }

    // 5+4+3+3+2 = 17 total ship cells
    let total_ship_counter = 17;

    // Did the declared winner actually win?
    if winner == 0 {
        // Did P1 sink all of P2's ships?
        assert(hits_on_ai == total_ship_counter);
    } else {
        // Did P2 sink all of P1's ships?
        assert(hits_on_player == total_ship_counter);
    }
}
```

---

## Integrating the Circuits

> With all three circuits ready, the next step was understanding where and how they run.

Now that the circuit is ready, it needs to receive data to start generating proofs. But where does this language run? Node.js? Rust? In the browser?

I'll compare the circuit lifecycle to smart contracts and, if you're from web2, to functions-as-a-service:

**Web2 - Functions-as-a-Service:**
```
Write → Compile → Test → Deploy to Cloud → Interact (cold start)
```

**Web3 - Smart contracts:**
```
Write → Compile → Test → Deploy to Blockchain (EVM/Soroban) → Interact (gas fee)
```

**Web3 ZK - Circuits:**
```
Write → Compile → Test → Import in client → Interact (CPU) → Output (proof)
```

Unlike Web2 and Web3, circuits **should not be executed on the server side**. Think about it: if you have to send your data to the server to generate a proof with secret inputs, you've already revealed your data to the network and to the server.

That's why circuits should be compiled and injected into the client, just like a WASM library or a JS asset that runs on the client.

After writing the circuits, compilation generates an executable binary capable of dynamically generating proofs with secret inputs. But compilation also generates another important artifact: the **Verification Key (VK)**.

The VK is the public half of the circuit — it contains everything a verifier needs to confirm that a proof is legitimate, without needing the full circuit or the secret data. In my project, the VKs for the board and match circuits are embedded inside the Soroban smart contract, which uses them to verify proofs on-chain. The attack circuit's VK stays only on the backend since it's verified off-chain.

To generate a proof from a Noir circuit, you need two components:

- **NoirJS** (`@noir-lang/noir_js`): executes the circuit and generates the **witness**
- **bb.js** (`@aztec/bb.js`): takes the witness and generates the proof

> **What is the witness?** It's the set of all intermediate values of the circuit during execution — like a complete trace of every wire in the circuit. The proof is generated from this witness.

On Node.js, it works like this:

```javascript
// Import the libs
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

// Import the circuit as an executable binary
const binary = fs.readFileSync('board_validity.json', 'utf-8');
const circuit = JSON.parse(binary);

// Instantiate the circuit
const backend = new UltraHonkBackend(circuit.bytecode);
const noir = new Noir(circuit);

// Generate witness (execute the circuit with secret inputs)
const { witness } = await noir.execute({
    ships: [[0, 0, 5, true], [2, 0, 4, true], ...],
    nonce: "12345",
    board_hash: "0x07488bfc...",
    ship_sizes: [5, 4, 3, 3, 2],
});

// Generate the proof: a Uint8Array artifact of 14592 bytes
const proof = await backend.generateProof(witness, { keccak: true });
```

The `{ keccak: true }` flag is unrelated to Poseidon2. Poseidon2 is the hash **we** use to hash the board — it's part of the game logic. This flag controls a different hash, used by **bb.js itself** under the hood when assembling the proof. By default it uses Blake3, but smart contracts don't have Blake3 — they have Keccak256. The flag switches to Keccak256, allowing the on-chain contract to verify the proof.

---

## Mobile ZK

> Node.js worked. The next challenge: running this on a mobile app.

On the backend (Node.js), this worked on the first try. But the plan was to generate proofs on the client, which in my case would be the mobile app. The player positions the ships, the app generates the proof locally, and sends only the proof to the backend (never the positions).

And here the fun began.

`bb.js` uses heavy WebAssembly. It loads megabytes of binaries to perform cryptographic operations. On Node.js and the browser, this works because both have mature WASM support. But React Native...

React Native doesn't run in a browser. It runs on its own JavaScript runtime (Hermes or JSC) that doesn't have full WebAssembly support. `bb.js` needs WASM threads, shared memory, and APIs that simply don't exist in the React Native runtime.

I tried several approaches:

**Attempt 1: import bb.js directly in React Native. (HACK)**
Failed immediately. WebAssembly doesn't exist in Hermes.

**Attempt 2: invisible WebView. (MASTER HACK)**
The idea: create a transparent `<WebView>` that loads an HTML page with bb.js, and communicate via `postMessage`. The WebView runs on a real browser engine, so WASM should work.

```tsx
// zk/adapter.tsx — WebView provider
<WebView
    source={{ html: zkWorkerHtml }}
    onMessage={(event) => {
        const result = JSON.parse(event.nativeEvent.data);
        // Proof generated!
    }}
/>
```

This almost worked. I deluded myself thinking the proofs "were just slow", that "I'd refine it later". I waited 20 minutes for proof generation and nothing — just burning memory and CPU. And the communication via `postMessage` added extra latency on top of that.

**Attempt 3: version downgrade.**
I thought maybe an older version of bb.js would be lighter. Tested bb.js 0.72.1 with noir_js beta.2. Still didn't run on React Native.

---

## The Painful Decision

> With three failed attempts, it was time to accept the cost of the previous decision.

I looked at the mobile app. 14 screens. Animations + haptic feedback as reactions. Animated splash screen with radar, 3D ship model, confetti...

In short, I had Claude Code migrate everything to a web client, reusing everything it could. I used basic Vite + React to make everything work in the browser.

The browser is a stable environment today and you can execute many things natively like WASM and other cryptography APIs. Everything worked and I didn't lose much of the app's beauty.

The technical learning was about how to handle imports in the browser to correctly load the circuit and libraries:

```javascript
// 1. Import compiled circuits as static JSON
import boardValidityCircuit from './circuits/board_validity.json';
import shotProofCircuit from './circuits/shot_proof.json';
import turnsProofCircuit from './circuits/turns_proof.json';

// 2. Import libs dynamically (heavy WASM, can't be bundled)
const [noirMod, bbMod] = await Promise.all([
  import('@noir-lang/noir_js'),
  import('@aztec/bb.js'),
]);

// 3. Instantiate the circuit with NoirJS
const noir = new noirMod.Noir(boardValidityCircuit);

// 4. Execute the circuit and generate the proof
const { witness } = await noir.execute(inputs);
const backend = new bbMod.UltraHonkBackend(boardValidityCircuit.bytecode);
const { proof, publicInputs } = await backend.generateProof(witness, { keccak: true });
```

The compiled circuits (`.json`) are imported as static assets — Vite resolves this at build time. NoirJS and bb.js are imported dynamically because they load heavy WASM that can't be pre-bundled (in `vite.config.ts` they go in `optimizeDeps.exclude`).

Here's another learning, this time non-technical.

**I should have written a hello world circuit and validated that it was possible to generate the proof on mobile on day 0, before starting the polish.** But I fell in love.

I fell in love because it was one of the coolest programming experiences I've ever had. In a game, it's super fun to test things because you're playing while you program — very different from testing signup screens or seeing if Docker will compile correctly this time.

---

## What We Have So Far

At the end of this phase:

- 3 Noir circuits compiled and tested (`board_validity`, `shot_proof`, `turns_proof`)
- 100% compatible with Stellar Protocol 25 (Poseidon2 + BN254)
- Circuits generating proofs on the web client (browser + bb.js + NoirJS)

The circuits were ready. The proofs were being generated. But nobody was verifying them yet — neither the backend nor the blockchain.

That's the next chapter.

---

← [Part 1 — "What did I get myself into?"](#)
→ [Part 3 — "The blockchain that verified the proof"](#)
