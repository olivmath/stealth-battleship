# Stellar Hacks: ZK Gaming — Hackathon Guide

## Overview

- **Prize Pool:** $10,000 USD em XLM
- **Deadline:** 23 de Fevereiro de 2026, 18:00 UTC
- **8 dias restantes para submission**
- **98 hackers registrados**
- **Track unica:** julgada por execucao tecnica, gameplay e documentacao
- **Link:** https://dorahacks.io/hackathon/stellar-hacks-zk-gaming/detail

## Premios

| Posicao | Premio |
|---------|--------|
| 1o lugar | $5,000 XLM |
| 2o lugar | $2,000 XLM |
| 3o lugar | $1,250 XLM |
| 4o lugar | $1,000 XLM |
| 5o lugar | $750 XLM |

---

## Requisitos de Submissao

### 1. ZK-Powered Mechanic (OBRIGATORIO)
- ZK proof deve ser a mecanica CORE do jogo, nao so um demo slide
- Deve usar ZK pra algo que importa pro jogador: hidden information, fair resolution, provable outcomes

### 2. Deployed Onchain Component (OBRIGATORIO)
- Contrato deployado na **Stellar Testnet**
- **DEVE chamar `start_game()` e `end_game()`** no game hub contract:
  - Contrato: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`
  - Interface: https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG?filter=interface

### 3. Frontend (OBRIGATORIO)
- UI funcional onde juizes possam ver o gameplay
- Mostrar como ZK + onchain conectam com a experiencia do jogador

### 4. Open-source Repo (OBRIGATORIO)
- GitHub/GitLab publico com codigo completo + README.md claro

### 5. Video Demo (OBRIGATORIO)
- 2-3 minutos mostrando gameplay e explicando a implementacao ZK

---

## ZK Options no Stellar

### Opcao 1: Noir + UltraHonk (nossa escolha)
- Linguagem Rust-like pra circuitos ZK
- **AVISO do hackathon:** "Noir support is currently limited on Stellar due to processing constraints in a decentralized computing environment. This is a situation that we expect to see evolving throughout the course of the hackathon."
- Noir Docs: https://noir-lang.org/docs/
- **Noir Verifier (Soroban):** https://github.com/yugocabrio/rs-soroban-ultrahonk

### Opcao 2: RISC Zero
- zkVM que roda programas Rust genéricos e gera proofs
- RISC Zero Docs: https://dev.risczero.com/
- **RISC Zero Verifier (Soroban):** https://github.com/NethermindEth/stellar-risc0-verifier/

---

## Stellar Game Studio (Quickstart)

Framework oficial do hackathon pra scaffolding de jogos on-chain.

**NAO e obrigatorio usar o Game Studio**, mas a integracao com o game hub contract (start_game/end_game) SIM e obrigatoria.

- Site: https://jamesbachini.github.io/Stellar-Game-Studio/
- GitHub: https://github.com/jamesbachini/Stellar-Game-Studio

### Pre-requisitos
- Bun (runtime JS)
- Rust & Cargo
- Stellar CLI (`cargo install --locked stellar-cli --features opt`)
- `rustup target add wasm32v1-none`

### Setup rapido
```bash
git clone https://github.com/jamesbachini/Stellar-Game-Studio.git
cd Stellar-Game-Studio
bun run setup          # build + deploy + bindings + frontend
bun run create my-game # scaffold novo jogo
bun run dev:game my-game  # dev server localhost:3000
bun run build my-game     # compila contrato
bun run deploy my-game    # deploy na testnet
bun run publish my-game --build  # export producao
```

### O que o setup faz
1. Build de todos os contratos Soroban pra WASM
2. Cria contas testnet (admin, player1, player2)
3. Deploy contratos na Stellar testnet
4. Gera TypeScript bindings
5. Configura env vars
6. Instala dependencias do frontend

### AI Ready
- Repo inclui `AGENTS.md` e `CLAUDE.md` pra guiar assistentes de codigo
- Repo map, Game Hub rules, deterministic RNG, bindings workflow

---

## Exemplos ZK (Referencia)

### Sudoku ZK (UltraHonk workflow completo)
- https://github.com/tupui/ultrahonk_soroban_contract
- Client-side proof generation + onchain verification + reward logic

### Maze ZK Verifier (contrato)
- https://github.com/kalepail/ultrahonk_soroban_contract
- Pattern de verifier on-chain pra provar moves/solutions validos

### Noir Experiments (circuitos)
- https://github.com/jamesbachini/Noirlang-Experiments
- Circuitos prontos pra clonar e adaptar

### Video: 3 Example Noir Circuits
- https://youtu.be/K0anQ9gQD1E

---

## Resources Links

### Stellar Dev Tools
- Stellar Docs: https://developers.stellar.org/
- SDKs: https://developers.stellar.org/docs/tools/sdks
- Stellar CLI: https://developers.stellar.org/docs/tools/cli
- Lab (browser tools): https://developers.stellar.org/docs/tools/lab
- Local Quickstart (Docker): https://developers.stellar.org/docs/tools/quickstart
- Stellar Wallets Kit: https://stellarwalletskit.dev/

### AI Dev Assistance
- Stellar Dev Skills: https://github.com/stellar/stellar-dev-skill
  - Inclui Stellar ZK skill

### Suporte
- Discord: https://discord.gg/MRZCHcMWDE (#zk-chat)
- Telegram: https://t.me/+FEA6-X1dfelkMzE5

---

## Ideias de Inspiracao (do hackathon)

- **Hidden-information games:** commit privado (moves, cards, loadouts), prova validade sem revelar
- **Provable outcomes:** resolver match com computacao verificavel
- **Private actions / fog-of-war:** estado escondido com provas de validade
- **Provable randomness:** fairness sem revelar seeds
- **Puzzle / strategy proofs:** provar solucao sem revelar

> "A clean, minimal prototype like tic-tac-toe, Sudoku, **Battleship**, or a simple card/strategy game is totally valid as long as ZK is essential to how it works"

---

## Impacto no Nosso Projeto

### O que ja temos alinhado
- Battleship e explicitamente citado como exemplo valido
- Noir + UltraHonk e uma das opcoes oficiais
- board_validity + shot_result sao ZK mechanics CORE (nao decorativo)
- Stellar testnet deploy e requirement — ja planejado

### O que precisa adaptar
1. **Game Hub integration:** contrato deve chamar `start_game()` e `end_game()` no contract `CB4VZAT2...`
2. **Frontend web:** hackathon espera frontend web (nao mobile RN) — precisa de um web client
3. **Noir no Soroban:** aviso de limitacao — testar se UltraHonk verifier funciona na testnet atual
4. **Verifier contract:** usar https://github.com/yugocabrio/rs-soroban-ultrahonk como base
5. **Video demo:** 2-3 min mostrando gameplay + ZK mechanics
6. **Avaliar Game Studio:** pode acelerar o scaffold, mas nao e obrigatorio

### ALERTA: Noir no Stellar
> "Noir support is currently limited on Stellar due to processing constraints"

Isso pode significar que o UltraHonk verifier e muito caro em gas/CPU no Soroban. Precisamos testar ASAP. Se nao funcionar, o fallback e RISC Zero (que tem verifier oficial da Nethermind).
