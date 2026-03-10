# Devlog: ZK Battleship

## Part 3 — "The blockchain that verified the proof"

*Finding a Soroban verifier, discovering the 5.5 XLM cold start, and spending 214 XLM chasing a bug that didn't exist*

---

### February 23rd: the day of 112 commits

The proofs were being generated on the client. The backend verified them locally using `bb.js`. But a backend verification isn't enough — anyone can run a backend and say "yeah, I trust it". We needed a place **where nobody controls** the verification: the blockchain.

The idea: submit ZK proofs to a smart contract on Stellar that verifies them independently. If the contract says the proof is valid, **anyone in the world can confirm**. It's immutable, transparent, trustless.

Easy to describe. Brutal to implement.

---

### What is Soroban?

Soroban is Stellar's smart contract platform. You write contracts in **Rust**, compile to WebAssembly, and deploy to the network. Unlike Ethereum/Solidity, Soroban has an explicit resource model — you pay for CPU, memory, I/O, and transaction size separately.

A basic Soroban contract:

```rust
#[contract]
pub struct MyContract;

#[contractimpl]
impl MyContract {
    pub fn hello(env: Env, name: Symbol) -> Symbol {
        // logic here
    }
}
```

Compile with `stellar contract build`, deploy with `stellar contract deploy`. So far, so good.

The problem is: I didn't need a simple contract. I needed a contract that **verified UltraHonk proofs**. That involves elliptic curve math, pairing operations, and hundreds of thousands of arithmetic operations.

---

### The hunt for a verifier

My first question: has anyone already written an UltraHonk verifier for Soroban?

Spoiler: almost nobody.

The ZK ecosystem on Soroban is nascent. There's no "OpenZeppelin for ZK" on Stellar. What exists is an experimental crate called `ultrahonk-soroban-verifier` — a port of the UltraHonk verification algorithm to the Soroban runtime, leveraging the native BN254 operations from Protocol 25.

Finding this crate was already an adventure. It wasn't in a public registry — I had to track it down through Stellar and Aztec ecosystem repos. When I found it, the API wasn't stable — it changed between the version I found and the one I needed.

Commit `fe29b0a`: `soroban: update SDK and verifier dependencies to official repos`
Commit `30e7939`: `soroban: migrate to UltraHonkVerifier struct API`

Each crate update changed the interface. What was `verify(vk, proof, inputs)` became `UltraHonkVerifier::new().verify(...)`. Adapted, recompiled, tested, broke, adapted again.

---

### The on-chain architecture

The final contract has a simple structure: it's an intermediary between the ZK verifier and a Stellar Game Hub.

```rust
#[contract]
pub struct BattleshipContract;

#[contractimpl]
impl BattleshipContract {
    pub fn verify_board(
        env: Env,
        proof: Bytes,
        pub_inputs: Bytes,
    ) -> Result<bool, Error> {
        let admin: Address = env.storage().instance().get(&ADMIN)?;
        admin.require_auth();

        let verifier = VerifierClient::new(&env, &verifier_addr);
        verifier.verify_board(&proof, &pub_inputs);
        Ok(true)
    }

    pub fn open_match(env: Env, p1: Address, p2: Address) -> Result<u32, Error> {
        // Increment session counter
        // Save match state
        // Notify Game Hub: start_game(...)
        Ok(session_id)
    }

    pub fn close_match(
        env: Env,
        session_id: u32,
        proof: Bytes,        // turns_proof
        pub_inputs: Bytes,
        player1_won: bool,
    ) -> Result<(), Error> {
        // Verify the result proof
        verifier.verify_turns(&proof, &pub_inputs);
        // Notify Game Hub: end_game(...)
        Ok(())
    }
}
```

The on-chain flow per match is just **4 transactions**:

1. `verify_board` — verifies Player 1's board proof
2. `verify_board` — verifies Player 2's board proof
3. `open_match` — registers the match and notifies the Game Hub
4. `close_match` — verifies the final proof and declares the winner

Note that `shot_proof` (each move) doesn't go on-chain. They're verified only on the backend. The blockchain only sees the beginning and the end. This is intentional — submitting a transaction per move would be too slow for a real-time game. The entire match is validated by the `turns_proof` at the end.

---

### Deploy and the first transactions

Deploy on testnet:

```bash
stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/battleship.wasm \
    --source GDANLGA... \
    --network testnet
```

Contract deployed: `CBDLYHFFUD2GYFXOPQ56JKXDDSCRW4C4WWAYFCXRRL5WTYJPREUMYTB4`

On the backend, I created the adapter that builds, simulates, signs, and submits transactions:

```typescript
// backend/src/soroban/adapter.ts
async function buildSignSubmit(kp, method, args) {
    const server = getServer();
    const account = await server.getAccount(kp.publicKey());
    const contract = new Contract(getContractId());

    const tx = new TransactionBuilder(account, {
        fee: '2147483647', // max u32 stroops
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

    // Simulate to estimate resources
    const simResult = await server.simulateTransaction(tx);
    const preparedTx = rpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(kp);

    const sendResult = await server.sendTransaction(preparedTx);
    // ... poll until confirmed
}
```

Look at that `fee: '2147483647'`. 2,147,483,647 stroops. That's the maximum value of an unsigned 32-bit integer. In XLM, that's **214.7 XLM** — around 30 dollars.

Why did I put that? Because I didn't know how much it cost to verify an UltraHonk proof on-chain. And every time I put a lower value, the transaction failed. So I kept increasing... increasing... until I put the maximum possible.

*"If it works with the maximum, I'll optimize later."*

---

### The first real transaction

I ran the E2E test. The match started. The boards were verified. And in the backend log:

```
[stellar] simulating verify_board...
[stellar] tx sent -> hash=06e56a10... status=PENDING
[stellar] verify_board confirmed -> tx=06e56a10...
```

It worked! I went to check on Stellar Expert how much it cost:

| TX | Operation | Fee charged | Max fee |
|---|---|---|---|
| `06e56a10...` | verify_board P1 | **55,447,433 stroops** | 73,721,713 |
| `5112644f...` | verify_board P2 | 337,380 stroops | 10,363,390 |
| `fbaedebf...` | open_match | 67,547 stroops | 10,085,595 |
| `1ca4f6b2...` | close_match | 503,479 stroops | 10,540,934 |

The first transaction cost **5.5 XLM**. The second — same operation, same data — cost **0.03 XLM**. 180 times cheaper.

What?

---

### The WASM cold start — or rather, Soroban's rent

This confused me for hours. The same function (`verify_board`), the same proof, the same contract. Why is the first one 180 times more expensive?

The answer isn't simply "cold cache". It's something more fundamental: **state rent**.

Soroban charges **rent** to keep data on-chain. Every piece of data — the contract's WASM bytecode, the verification keys, the admin address — has a **TTL** (Time To Live). On testnet, the default TTL for Instance storage is approximately 5 days. When the TTL expires, the state isn't deleted, but becomes **archived**: inaccessible until someone pays to restore it.

What happened on the first transaction:

1. The contract had just been deployed — but between the deploy and the first real test, the Instance storage TTL was already short
2. The tx needed to **restore** the Verifier's WASM bytecode (UltraHonk, which is large), the verification keys, and all the Instance storage
3. The restore cost is proportional to the **data size** — and the UltraHonk verifier WASM is the largest payload in the system

The second call (`verify_board` for Player 2), made 5 seconds later, cost 0.03 XLM — because the state was already restored with a renewed TTL.

Analyzing the account's 202 transactions via Horizon API, the pattern became obvious:

| Scenario | Fee per `verify_board` | Multiplier |
|---|---|---|
| Hot state (consecutive calls) | ~0.034 XLM | 1x |
| Cold state (after days without use) | ~5.54 XLM | **163x** |

The cost isn't random. It's predictable: every time the contract went more than ~5 days without being used, the next call paid for restore. It happened on 02/23 (first use), on 03/06 (11 days after the last use), and would happen again if I did nothing.

On the second round of tests, when the contract was already "hot":

| TX | Fee charged (1st round) | Fee charged (2nd round) |
|---|---|---|
| verify_board P1 | **5.54 XLM** | **0.034 XLM** |
| verify_board P2 | 0.034 XLM | 0.034 XLM |
| open_match | 0.007 XLM | 0.007 XLM |
| close_match | 0.050 XLM | 0.050 XLM |
| **Total** | **~5.63 XLM** | **~0.12 XLM** |

The real cost of a match is **~0.12 XLM** (less than 2 cents). But I was paying 214 XLM max fee because I didn't know any of this.

---

### Optimizing the fee

Now that I understood the problem, I wanted to remove that absurd max fee. First attempt: rebuild the transaction with the real fee from the simulation.

```typescript
// Simulate
const simResult = await server.simulateTransaction(tx);
const minFee = simResult.minResourceFee;

// Rebuild TX with the real fee + margin
const txWithFee = new TransactionBuilder(account, {
    fee: String(Math.ceil(minFee * 1.15)),
    ...
}).build();

const preparedTx = rpc.assembleTransaction(txWithFee, simResult).build();
```

Ran the test. First transaction: success. Second transaction: **ERROR**.

```
[stellar] tx sent -> hash=336f108c... status=ERROR
```

What happened? The `TransactionBuilder` increments the account's **sequence number** every time you create a transaction. When I created `tx` to simulate, the sequence number went to N+1. When I created `txWithFee` with the same account, it went to N+2. But the simulation was done with N+1 — so transaction N+2 didn't match.

Commit `d407a88`: `perf(soroban): remove fee simulation rebuild to reduce overhead`

The solution: don't rebuild. The SDK's `assembleTransaction` already sets the correct fee based on the simulation. Just use a high enough fee cap in the initial build and let the SDK do the work:

```typescript
const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,  // placeholder — assembleTransaction adjusts
    networkPassphrase: Networks.TESTNET,
})
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

const simResult = await server.simulateTransaction(tx);
const minFee = simResult.minResourceFee;
console.log(`${method} minResourceFee=${minFee} (${minFee/1e7} XLM)`);

const preparedTx = rpc.assembleTransaction(tx, simResult).build();
preparedTx.sign(kp);
```

Now the log shows the real cost of each operation:

```
[stellar] verify_board minResourceFee=363149 stroops (0.0363 XLM)
[stellar] open_match minResourceFee=57424 stroops (0.0057 XLM)
[stellar] close_match minResourceFee=437808 stroops (0.0438 XLM)
```

---

### Protocol 25: why this is only possible now

It's worth explaining why this on-chain verification is feasible on Stellar but would be prohibitively expensive on other blockchains.

An UltraHonk proof involves operations with points on the BN254 elliptic curve — scalar multiplication, point addition, and pairings. These operations are the bulk of the computational cost.

Before Protocol 25, implementing these operations on Soroban would mean doing them in pure Rust code inside the smart contract. That would be millions of WASM instructions per verification.

With Protocol 25 (X-Ray), Stellar added:
- **`bls12_381` and BN254**: elliptic curve operations as host functions
- **Poseidon2**: hash function as host function

A host function is executed directly by the validator in native code, not interpreted by WASM. It's like comparing running a program in Python versus calling a function in compiled C — orders of magnitude faster.

The practical result: verifying an UltraHonk proof costs ~0.05 XLM instead of being literally impossible by exceeding computation limits.

---

### What we have so far

At the end of day 23:

- Soroban contract deployed on testnet
- 4 transactions per match (2 verify_board + open_match + close_match)
- Real cost: ~0.12 XLM per match (~$0.02)
- Dynamic fee based on simulation
- Integration with Stellar Game Hub for on-chain tracking

The contract hashes on Stellar Expert:
- Battleship Contract: `CBDLYHFFUD2GYFXOPQ56JKXDDSCRW4C4WWAYFCXRRL5WTYJPREUMYTB4`
- Game Hub: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

The proofs were being generated on the client, verified on the backend, AND verified on-chain. The most chaotic part was left: making two players face each other in real time.

---

*Previous: [Part 2 — "Proving without showing"](./02-proving-without-showing.md)*
*Next: [Part 4 — "Two ships, one battle"](./04-two-ships-one-battle.md)*
