# Diário de Bordo: ZK Battleship

## Parte 3 — "A blockchain que verificou a prova"

*Encontrando um verificador Soroban, descobrindo o cold start de 5.5 XLM, e gastando 214 XLM procurando um bug que não existia*

---

### 23 de fevereiro: o dia dos 112 commits

As provas estavam sendo geradas no cliente. O backend verificava localmente usando `bb.js`. Mas uma verificação no backend não é suficiente — qualquer um pode rodar um backend e dizer "sim, confio". Precisávamos de um lugar **onde ninguém controla** a verificação: a blockchain.

A ideia: submeter as provas ZK para um smart contract na Stellar que as verifica de forma independente. Se o contrato diz que a prova é válida, **qualquer pessoa no mundo pode confirmar**. É imutável, transparente, trustless.

Fácil de descrever. Brutal de implementar.

---

### O que é Soroban?

Soroban é a plataforma de smart contracts da Stellar. Você escreve contratos em **Rust**, compila para WebAssembly, e faz deploy na rede. Diferente do Ethereum/Solidity, Soroban tem um modelo de recursos explícito — você paga por CPU, memória, I/O, e tamanho de transação separadamente.

Um contrato Soroban básico:

```rust
#[contract]
pub struct MeuContrato;

#[contractimpl]
impl MeuContrato {
    pub fn hello(env: Env, name: Symbol) -> Symbol {
        // lógica aqui
    }
}
```

Compila com `stellar contract build`, faz deploy com `stellar contract deploy`. Até aí, tranquilo.

O problema é: eu não precisava de um contrato simples. Eu precisava de um contrato que **verificasse provas UltraHonk**. Isso envolve matemática de curva elíptica, pairing operations, e centenas de milhares de operações aritméticas.

---

### A caça ao verificador

Minha primeira pergunta: alguém já escreveu um verificador UltraHonk para Soroban?

Spoiler: quase ninguém.

O ecossistema de ZK no Soroban é nascente. Não existe um "OpenZeppelin para ZK" na Stellar. O que existe é um crate experimental chamado `ultrahonk-soroban-verifier` — um port do algoritmo de verificação UltraHonk para o runtime Soroban, aproveitando as operações BN254 nativas do Protocol 25.

Encontrar esse crate já foi uma aventura. Não estava num registro público — tive que rastrear pelos repos do ecossistema Stellar e Aztec. Quando encontrei, a API não era estável — mudou entre a versão que eu encontrei e a que eu precisava.

Commit `fe29b0a`: `soroban: update SDK and verifier dependencies to official repos`
Commit `30e7939`: `soroban: migrate to UltraHonkVerifier struct API`

Cada atualização do crate mudava a interface. O que era `verify(vk, proof, inputs)` virou `UltraHonkVerifier::new().verify(...)`. Adaptei, recompilei, testei, quebrou, adaptei de novo.

---

### A arquitetura on-chain

O contrato final tem uma estrutura simples: ele é um intermediário entre o verificador ZK e um Game Hub da Stellar.

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
        // Incrementa session counter
        // Salva estado da partida
        // Notifica o Game Hub: start_game(...)
        Ok(session_id)
    }

    pub fn close_match(
        env: Env,
        session_id: u32,
        proof: Bytes,        // turns_proof
        pub_inputs: Bytes,
        player1_won: bool,
    ) -> Result<(), Error> {
        // Verifica a prova do resultado
        verifier.verify_turns(&proof, &pub_inputs);
        // Notifica o Game Hub: end_game(...)
        Ok(())
    }
}
```

O fluxo on-chain por partida é de apenas **4 transações**:

1. `verify_board` — verifica prova do tabuleiro do Jogador 1
2. `verify_board` — verifica prova do tabuleiro do Jogador 2
3. `open_match` — registra a partida e notifica o Game Hub
4. `close_match` — verifica a prova final e declara o vencedor

Note que os `shot_proof` (cada jogada) não vão on-chain. São verificados apenas no backend. A blockchain só vê o início e o fim. Isso é intencional — submeter uma transação a cada jogada seria lento demais para um jogo em tempo real. A partida inteira é validada pela `turns_proof` no final.

---

### Deploy e as primeiras transações

Deploy no testnet:

```bash
stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/battleship.wasm \
    --source GDANLGA... \
    --network testnet
```

Contrato deployado: `CBDLYHFFUD2GYFXOPQ56JKXDDSCRW4C4WWAYFCXRRL5WTYJPREUMYTB4`

No backend, criei o adapter que monta, simula, assina e submete as transações:

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

    // Simula para estimar recursos
    const simResult = await server.simulateTransaction(tx);
    const preparedTx = rpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(kp);

    const sendResult = await server.sendTransaction(preparedTx);
    // ... poll até confirmar
}
```

Olha aquele `fee: '2147483647'`. 2.147.483.647 stroops. Isso é o valor máximo de um inteiro unsigned de 32 bits. Em XLM, são **214.7 XLM** — algo em torno de 30 dólares.

Por que eu coloquei isso? Porque eu não sabia quanto custava verificar uma prova UltraHonk on-chain. E toda vez que eu colocava um valor menor, a transação falhava. Então fui aumentando... aumentando... até colocar o máximo possível.

*"Se funcionar com o máximo, depois eu otimizo."*

---

### A primeira transação real

Rodei o teste E2E. A partida começou. Os tabuleiros foram verificados. E no log do backend:

```
[stellar] simulating verify_board...
[stellar] tx sent -> hash=06e56a10... status=PENDING
[stellar] verify_board confirmed -> tx=06e56a10...
```

Funcionou! Fui checar na Stellar Expert quanto custou:

| TX | Operação | Fee cobrado | Fee máximo |
|---|---|---|---|
| `06e56a10...` | verify_board P1 | **55.447.433 stroops** | 73.721.713 |
| `5112644f...` | verify_board P2 | 337.380 stroops | 10.363.390 |
| `fbaedebf...` | open_match | 67.547 stroops | 10.085.595 |
| `1ca4f6b2...` | close_match | 503.479 stroops | 10.540.934 |

A primeira transação custou **5.5 XLM**. A segunda — mesma operação, mesmos dados — custou **0.03 XLM**. 180 vezes mais barata.

Quê?

---

### O cold start do WASM — ou melhor, o rent do Soroban

Isso me deixou confuso por horas. A mesma função (`verify_board`), a mesma prova, o mesmo contrato. Por que a primeira é 180 vezes mais cara?

A resposta não é simplesmente "cache frio". É algo mais fundamental: **state rent**.

O Soroban cobra **aluguel** para manter dados on-chain. Todo dado — o bytecode WASM do contrato, as chaves de verificação, o endereço do admin — tem um **TTL** (Time To Live). Na testnet, o TTL padrão do Instance storage é de aproximadamente 5 dias. Quando o TTL expira, o estado não é deletado, mas fica **archived**: inacessível até alguém pagar para restaurá-lo.

O que aconteceu na primeira transação:

1. O contrato tinha acabado de ser deployado — mas entre o deploy e o primeiro teste real, o TTL do Instance storage já estava curto
2. A tx precisou **restaurar** o bytecode WASM do Verifier (o UltraHonk, que é grande), as verification keys, e todo o Instance storage
3. O custo de restore é proporcional ao **tamanho dos dados** — e o WASM do verificador UltraHonk é o maior payload do sistema

A segunda chamada (`verify_board` do Jogador 2), feita 5 segundos depois, custou 0.03 XLM — porque o estado já estava restaurado e com TTL renovado.

Analisando as 202 transações da conta via Horizon API, o padrão ficou óbvio:

| Cenário | Fee por `verify_board` | Multiplicador |
|---|---|---|
| Estado quente (chamadas consecutivas) | ~0.034 XLM | 1x |
| Estado frio (após dias sem uso) | ~5.54 XLM | **163x** |

O custo não é aleatório. É previsível: toda vez que o contrato ficava mais de ~5 dias sem ser usado, a próxima chamada pagava restore. Aconteceu em 23/02 (primeiro uso), em 06/03 (11 dias depois do último uso), e aconteceria de novo se eu não fizesse nada.

Na segunda rodada de testes, quando o contrato já estava "quente":

| TX | Fee cobrado (1ª rodada) | Fee cobrado (2ª rodada) |
|---|---|---|
| verify_board P1 | **5.54 XLM** | **0.034 XLM** |
| verify_board P2 | 0.034 XLM | 0.034 XLM |
| open_match | 0.007 XLM | 0.007 XLM |
| close_match | 0.050 XLM | 0.050 XLM |
| **Total** | **~5.63 XLM** | **~0.12 XLM** |

O custo real de uma partida é **~0.12 XLM** (menos de 2 centavos). Mas eu estava pagando 214 XLM de fee máximo porque não sabia disso.

---

### Otimizando o fee

Agora que eu entendia o problema, queria remover aquele fee máximo absurdo. A primeira tentativa: reconstruir a transação com o fee real da simulação.

```typescript
// Simula
const simResult = await server.simulateTransaction(tx);
const minFee = simResult.minResourceFee;

// Reconstrói TX com o fee real + margem
const txWithFee = new TransactionBuilder(account, {
    fee: String(Math.ceil(minFee * 1.15)),
    ...
}).build();

const preparedTx = rpc.assembleTransaction(txWithFee, simResult).build();
```

Rodei o teste. Primeira transação: sucesso. Segunda transação: **ERROR**.

```
[stellar] tx sent -> hash=336f108c... status=ERROR
```

O que aconteceu? O `TransactionBuilder` incrementa o **sequence number** da conta toda vez que você cria uma transação. Quando eu criei `tx` para simular, o sequence number foi para N+1. Quando criei `txWithFee` com a mesma conta, foi para N+2. Mas a simulação foi feita com N+1 — então a transação N+2 não batia.

Commit `d407a88`: `perf(soroban): remove fee simulation rebuild to reduce overhead`

A solução: não reconstruir. O `assembleTransaction` do SDK já seta o fee correto baseado na simulação. Basta usar um fee cap alto o suficiente na construção inicial e deixar o SDK fazer o trabalho:

```typescript
const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,  // placeholder — assembleTransaction ajusta
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

Agora o log mostra o custo real de cada operação:

```
[stellar] verify_board minResourceFee=363149 stroops (0.0363 XLM)
[stellar] open_match minResourceFee=57424 stroops (0.0057 XLM)
[stellar] close_match minResourceFee=437808 stroops (0.0438 XLM)
```

---

### Protocol 25: por que isso só é possível agora

Vale explicar por que essa verificação on-chain é viável na Stellar mas seria proibitivamente cara em outras blockchains.

Uma prova UltraHonk envolve operações com pontos na curva elíptica BN254 — multiplicação escalar, adição de pontos, e pairings. Essas operações são o grosso do custo computacional.

Antes do Protocol 25, implementar essas operações no Soroban significaria fazê-las em código Rust puro dentro do smart contract. Seriam milhões de instruções WASM para cada verificação.

Com o Protocol 25 (X-Ray), a Stellar adicionou:
- **`bls12_381` e BN254**: operações de curva elíptica como host functions
- **Poseidon2**: hash function como host function

Uma host function é executada direto pelo validator em código nativo, não interpretada pelo WASM. É como comparar rodar um programa em Python versus chamar uma função em C compilado — ordens de grandeza mais rápido.

O resultado prático: verificar uma prova UltraHonk custa ~0.05 XLM em vez de ser literalmente impossível por exceder os limites de computação.

---

### O que temos até aqui

Ao final do dia 23:

- Contrato Soroban deployado no testnet
- 4 transações por partida (2 verify_board + open_match + close_match)
- Custo real: ~0.12 XLM por partida (~$0.02)
- Fee dinâmico baseado na simulação
- Integração com Game Hub da Stellar para tracking on-chain

O hash dos contratos na Stellar Expert:
- Battleship Contract: `CBDLYHFFUD2GYFXOPQ56JKXDDSCRW4C4WWAYFCXRRL5WTYJPREUMYTB4`
- Game Hub: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

As provas estavam sendo geradas no cliente, verificadas no backend, E verificadas on-chain. Faltava a parte mais caótica: fazer dois jogadores se enfrentarem em tempo real.

---

*Anterior: [Parte 2 — "Provando sem mostrar"](./02-provando-sem-mostrar.md)*
*Próximo: [Parte 4 — "Dois navios, uma batalha"](./04-dois-navios-uma-batalha.md)*
