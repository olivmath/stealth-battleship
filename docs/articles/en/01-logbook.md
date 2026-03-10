# The Hackathon

February 2026. The Stellar Development Foundation announces **Stellar Hacks: ZK Gaming** — a hackathon to build on-chain games using zero-knowledge proofs. The prize? Recognition, feedback from Stellar devs, and the chance to show that ZK isn't just academic paper stuff.

I signed up without ever having made a game before. I thought it would be just another project with smart contracts and maybe a bit more interesting because it required implementing zero-knowledge proofs. In my head, writing a Battleship would be perfect to integrate with ZK.

This is the devlog of how I built **Stealth Battleship** in:

- **17 days**
- **331 commits**
- **4 languages**

---

## Problem: Someone always sees both boards.

<!-- image -->

You know Battleship. Two players, each with a board. You place your ships, the opponent places theirs. Nobody sees the other's board. You attack a coordinate, the opponent says "hit" or "miss".

Simple in real life, where each player has their board behind a barrier. But in the digital world, who guards the boards?

**Approach 1: the server sees everything.** The server knows where both players' ships are. It works, but you need to trust that the server won't cheat. If the server wants to favor a player, it can, and you'd never know.

**Approach 2: commit-reveal.** Each player hashes their board at the start and publishes the hash. At the end, they reveal the original board and everyone checks if it matches the hash. Seems elegant, but it has a vulnerability: if the player is losing, they simply disconnect. Never reveals. Nobody can prove anything.

**Approach 3: board on-chain.** Put everything on the blockchain! Verifiable and immutable. Except that... the blockchain is public. Anyone can read the blocks and see the transactions before they're confirmed. Your opponent would see your ships before the game even starts.

None of the three works. They all fail for a fundamental reason: **at some point, someone sees information they shouldn't see**.

---

## Solution: What if nobody needed to see?

<!-- image -->

Zero-Knowledge Proofs (ZK) solve exactly this. The idea is simple to understand, but profound in its consequences:

> I can **prove** to you that something is true, **without showing you** the information that makes it true.

Simple.

Imagine I'm preparing a surprise marriage proposal. I asked you, a craftsman, to create a diamond ring. But you can't show the ring to anyone, not even to me, because that would ruin the surprise.

Even so, you make a claim:

> *The diamond on the ring is real.*

But I want to be sure that's true. Except seeing the ring would ruin everything.

So I take the ring to a diamond specialist. He examines the stone and, after running the necessary tests, hands me a certificate saying:

> *The analyzed diamond is real.*
> *The stone passed all authenticity tests.*

I never saw:

- The ring.
- The tests that could reveal characteristics about it.
- The size, shape, color, value, or any other detail about the ring.

Still, I have a proof. I have zero knowledge about the ring, except for the fact that it is real.

**I have a Proof and Zero Knowledge about the fact.**
If you lie, the specialist will find out. Cheating is impossible.

---

## Applying ZK to Battleship

<!-- image -->

The diamond will be the board and the specialist, the math. With this idea, the game works like this:

1. **Start**: each player places their ships and generates a ZK Proof that the board is valid. The proof is public; the board is not.
2. **Each move**: when I attack coordinate (3, 5) on my opponent's board, they tell me "hit" or "miss" — and along with it send a ZK Proof that the answer is honest against the original board.
3. **End**: when all ships are sunk, the entire match is replayed inside a circuit that deterministically calculates the winner and generates a final ZK Proof.

Nobody ever sees the other's board. There's no omniscient server. There's no reveal at the end that can be avoided. Math guarantees everything.

---

## But does ZK work on Stellar?

<!-- image -->

Stellar just launched **Protocol 25**, codename **X-Ray**. This upgrade added advanced cryptography operations — **BN254**, **Poseidon2**, and **BLS12-381** — directly into the protocol. Not in smart contracts. Not on L2. In the protocol itself.

To understand the impact: verifying a ZK proof requires heavy math operations — elliptic curve point multiplication, hashing, pairings. On other blockchains, this runs inside smart contracts, which is slow and expensive. On Stellar, these operations are now native protocol instructions.

The result? Verifying a ZK Proof on Stellar costs around **$0.005 USD**. Orders of magnitude cheaper than on any other blockchain.

(Yes, I thought it was $30 USD. I explain this mistake in part 3).

---

## The First Commit: February 7, 2026.

<!-- image -->

After 48 hours, I already had a playable game:

- 6x6 board with 3 ships
- AI with hunt/target algorithm
- Animations, ranking, match history.

The game looked great. Screens with dark naval aesthetics, Orbitron fonts, navy blue gradients with gold accents. Tutorial, configurable difficulty, internationalization in 3 languages.

But it was a normal game. No ZK. No blockchain. Nothing that justified the hackathon.

Looking back, the project had 4 clear phases:

| Period | Focus | Commits |
|--------|-------|---------|
| Feb 07-08 | Complete single-player game | 107 |
| Feb 14-15 | Research: ZK, Noir, Stellar Protocol | 255 |
| Feb 21-22 | ZK circuits + PvP backend | 100 |
| Feb 23 | Backend, frontend, and Soroban deploy on testnet | 112 |

February 23rd deserves an asterisk. 112 commits in a single day. It was the day everything needed to work together: ZK Proofs generated on the client, verified on the backend, submitted to the blockchain, with two real players facing each other via WebSocket online.

Each fix led to another bug, which led to another discovery.

**GOOD TIMES GUARANTEED.**

But I'm getting ahead of the story.

---

## To be continued...

<!-- image -->

In the next articles, I'll tell each phase with real code, real mistakes, and the "eureka" moments that made the project work:

- **Part 2**: Writing ZK Proofs in Noir and discovering that the mobile app can't run ZK Proofs (bb.js)
- **Part 3**: Verifying proofs on the Stellar blockchain and spending 214 XLM chasing a bug.
- **Part 4**: Connecting two players in real time and the avalanche of race conditions.
- **Part 5**: The lesson that cost 214 XLM — what I learned and would do differently.

If you've never worked with ZK, blockchain, or games together — well, neither had I. Let's go.

---

*Next: [Part 2 — "Proving without showing"](./02-proving-without-showing.md)*
