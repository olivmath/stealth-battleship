This is Stealth Battleship — a trustless naval warfare game where every move is cryptographically proven using zero-knowledge proofs, built on Stellar.


In regular digital Battleship, someone always has to see both boards — a server, a smart contract, or an end-game reveal. That means you have to trust someone not to cheat.

We eliminate that entirely. With ZK proofs, no one ever sees your board — not the server, not the blockchain, anybody.

Here's how it works. We have three Noir circuits running client-side:

Board validity — when you place your ships, a ZK proof generated on the device ensures that your board is valid — correct ship sizes, no overlaps, within bounds — without revealing where.

Shot proof — whenever you receive a shot, the device responds with a proof generated on itself that confirms whether it was a hit or a miss, verified against the hash of your committed board. Lying is mathematically impossible.

Move proof — at the end of the game, the entire game sequence is reproduced within a circuit to calculate and prove the winner by the backend and saved on chain.

Let me show you the game in action.

Here I'm placing my ships on the 10x10 grid... drag and drop... or auto placed

When I tap Ready, you can see 'Securing your fleet' — that's the board_validity proof being generated client-side with NoirJS.

Now the board hash is committed on Stellar via Soroban...

Battle begins — I tap a cell to attack... the opponent's device generates a shot_proof to confirm the result... hit!

And when the game ends — the server generates the turns_proof, submits it on-chain, and claws back the BATTLE token to the winner.

The architecture is hybrid. On-chain, we have three blockchain moments per match — payment and BATTLE token issuance, start with board proofs anchored, and end with the turns_proof settled and BATTLE token clawed back to the winner.

We chose Stellar because Protocol 25 X-Ray gives us native BN254 curve operations and Poseidon2 hashing — the exact primitives our Noir circuits use.

This means proof verification on-chain is efficient, not emulated.


What makes this different:

ZK isn't a feature — it IS the game. Remove it and nothing works.

Three specialized circuits covering the complete game lifecycle.

Prove-as-you-go — no commit-reveal, no board reveal, ever.

And it's a real, polished mobile game — with animations, haptics, AI opponent, match history, rankings, and three languages.

Stealth Battleship proves that zero-knowledge isn't just for DeFi — it's the foundation of fair, trustless gaming. On Stellar's Protocol 25, we have everything we need to make this real.

Fair by math. Fun by design.
