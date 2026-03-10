# Diário de Bordo: ZK Battleship

## Parte 2 — "Provando sem Provar"

*>>> ARTIGO FEITO À MÃO COM CORREÇÕES DE GRAMÁTICA FEITAS POR A.I. <<<*

---

## 21 de Fevereiro: Aprendendo ZK de verdade

O jogo single-player estava pronto. Bonito, jogável, com 14 telas e animações. Mas até agora não tinha uma única linha de código ZK.

**Mas como você escreve uma prova zero-knowledge?**

Você não escreve a Prova de Conhecimento Zero (ZKP) diretamente. Você escreve um circuito. Um circuito é um programa que descreve as regras que a prova precisa satisfazer. Depois, uma ferramenta matemática usa o circuito junto com os dados de entrada, públicos e privados para gerar a Prova de Conhecimento Zero que vamos chamar simplesmente de prova.

Essas regras se chamam **restrições** e vão gerar uma prova de computação. Uma prova de que aquele código executou de forma correta sem revelar os dados de entrada da execução.

---

## Noir: A Linguagem dos Circuitos

Existem várias linguagens para escrever circuitos ZK como: Circom, Cairo, Noir, entre outras. Escolhi Noir por três razões:

1. A sintaxe é similar ao Rust: então eu já "sabia" programar.
2. Conjunto de ferramentas: muito prático de instalar, compilar, testar e gerar as provas.
3. O sistema de provas compatível: o Protocol 25 da Stellar é totalmente compatível com o sistema UltraHonk de geração de provas. (os dois usam a mesma curva elíptica BN254 e função de hash Poseidon2)

---

## Circuito do Tabuleiro

O circuito mais importante é o primeiro: provar que seu tabuleiro é válido sem revelar onde estão os navios.

O que ele precisa verificar:

- Provar que o tabuleiro usado é o que está sendo provado (compromisso público)
- Os navios têm os tamanhos corretos (5, 4, 3, 3, 2)
- Nenhum navio sai dos limites do tabuleiro 10x10
- Nenhum navio se sobrepõe a outro

Eu modelei o tabuleiro como uma matriz 10x10 e os navios como vetores do tipo `A[i][j]`.

As restrições eu modelei como funções de if/else que deveriam quebrar o circuito como um todo caso alguma falhasse. Assim, ou tudo está válido ou nada está, fazendo o circuito ser **atômico**.

E para transformar essas restrições em código usei Noir assim:

```rust
use poseidon::poseidon2::Poseidon2;

fn main(
    ships: [(u8, u8, u8, bool); 5],      // Coordenadas dos navios (SECRETO)
    nonce: Field,                        // número aleatório (SECRETO)
    board_hash: pub Field,               // compromisso público
    ship_sizes: pub [u8; 5],             // tamanhos esperados
) {
    // 1. Validar o compromisso público
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash inválido");

    // 2. Validar o tamanho dos navios
    for i in 0..5 {
        let (_, _, size, _) = ships[i];
        assert(size == ship_sizes[i], "tamanho de navio inválido");
    }

    // 3. Validar os limites do tabuleiro
    for i in 0..5 {
        let (row, col, size, horizontal) = ships[i];
        assert(ship_in_bounds(row, col, size, horizontal));
    }

    // 4. Validar sobreposição de navios
    for i in 0..5 {
        for j in (i + 1)..5 {
            assert(!ships_overlap(ships[i], ships[j]));
        }
    }
}
```

Observe a palavra-chave `pub`. Parâmetros marcados com `pub` são públicos e qualquer um pode vê-los. Parâmetros sem `pub` são privados, só quem gera a prova os conhece.

- `ships`: coordenadas dos seus navios.
- `nonce`: número aleatório para evitar que alguém teste todas as combinações possíveis de tabuleiro até encontrar o `board_hash` e descobrir as posições reais.
- `board_hash` e `ship_sizes`: todos podem verificar que a prova foi gerada contra esse hash específico e com esses tamanhos de navio.

---

## SHA256 vs Poseidon2

Um detalhe que parece pequeno mas é uma das decisões mais importantes do projeto: qual função de hash usar.

No mundo normal, você usaria SHA-256 pela simplicidade e porque qualquer linguagem de programação tem ela disponível nativamente.

Eu até comecei com SHA-256 pra acelerar o MVP, mas dentro de um circuito ZK, SHA-256 é extremamente cara e lenta. Cada operação bitwise vira milhares de restrições depois do circuito ser compilado, tornando a prova lenta para gerar e cara pra verificar.

Poseidon2 é uma função de hash desenhada especificamente para circuitos ZK. Ela opera sobre campos finitos em vez de bits, o que a torna ordens de grandeza mais eficiente dentro de um circuito.

```rust
fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 5],
    nonce: Field
) -> Field {
    let mut inputs: [Field; 21] = [0; 21];
    for i in 0..5 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;             // linha
        inputs[i * 4 + 1] = c as Field;             // coluna
        inputs[i * 4 + 2] = s as Field;             // tamanho
        inputs[i * 4 + 3] = if h { 1 } else { 0 };  // orientação
    }
    inputs[20] = nonce;                             // sal aleatório
    Poseidon2::hash(inputs, 21)
}
```

5 navios × 4 campos cada = 20 inputs + 1 nonce = 21 bytes no total. O Poseidon2 transforma todos os inputs em um único elemento de campo (Field) de 254 bits. Esse é o compromisso público do tabuleiro.

O nonce é crucial: sem ele, alguém poderia tentar todas as combinações possíveis de tabuleiro e comparar com o hash público. O nonce torna isso impossível — ele é um sal aleatório que só você conhece.

E aqui vem o bônus: a Stellar implementou Poseidon2 como instrução nativa no Protocol 25. Isso significa que quando verificamos o hash on-chain, não estamos executando código de smart contract na verdade estamos usando uma operação nativa do protocolo. Rápido e barato.

---

## Circuito de Ataque

> Com o tabuleiro validado, o próximo problema é garantir honestidade durante a partida.

Além de provar que o tabuleiro é válido, também precisamos provar que cada ação durante o jogo é honesta.

Quando meu oponente ataca a coordenada (3, 5) do meu tabuleiro, eu digo "acertou" ou "errou". Mas como ele sabe que eu não estou mentindo?

Escrevi 2 restrições para essa prova:

1. O hash que estou usando deve ser o mesmo do tabuleiro do início.
2. Caso tenha um navio naquela coordenada, digo `true`; se não, `false`.

Se eu tentar mentir (dizer "errou" quando ele "acertou" o navio), o circuito falha e a prova não pode ser gerada. Mentir sem quebrar a segurança do sistema de provas é matematicamente inviável.

E o código disso fica assim:

```rust
fn main(
    ships: [(u8, u8, u8, bool); 5],    // minhas posições (SECRETAS)
    nonce: Field,                      // meu nonce (SECRETO)
    board_hash: pub Field,             // compromisso público
    row: pub u8,                       // coordenada X atacada
    col: pub u8,                       // coordenada Y atacada
    is_hit: pub bool,                  // minha resposta
) {
    // O hash bate com o tabuleiro que eu comprometi no início?
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash inválido");

    // A resposta é consistente com a posição real dos navios?
    let actual_hit = cell_is_hit(ships, row, col);
    assert(actual_hit == is_hit, "resultado desonesto");
}
```

**Mas espera — por que `is_hit` é um input e não um retorno do circuito?**

Circuitos ZK não retornam valores. Eles são sistemas de restrições. Isso quer dizer que eles só fazem `assert`, passam ou falham. Se o circuito pudesse retornar o resultado calculado de `cell_is_hit`, ele teria que expor algo derivado de `ships`, que é privado. Isso vazaria informação sobre onde estão os navios.

No mundo dos circuitos o padrão é o **inverso** do mundo da programação:

> Você declara o resultado (`is_hit = true`), e o circuito prova que sua declaração é verdadeira com os dados secretos. Se sua declaração for falsa, a prova simplesmente não é gerada porque o circuito falha.

---

## Circuito Final da Partida

> Com a validação de tabuleiro e de ataques individuais resolvida, faltava o árbitro da partida inteira.

O circuito final é o mais ambicioso: fazer o replay da partida inteira e calcular, passo a passo, o vencedor sem revelar os tabuleiros, de forma matematicamente verificável.

Esse circuito é o árbitro final. Ele recebe toda a história da partida, todos os ataques dos dois jogadores e recalcula quem ganhou. Se alguém tentar declarar o vencedor errado, a prova falha.

Os circuitos ZK em Noir exigem que os arrays tenham tamanho fixo em tempo de compilação. Por isso usei um array de ataques com tamanho fixo de 100 (que é o número máximo para um tabuleiro de 10x10). Os slots não usados são preenchidos com `(0, 0)` e ignorados via o contador `n_attacks`.

Esse circuito é o maior, mais lento e mais caro dos três; Mesmo assim o custo de verificação on-chain na Stellar foi de apenas **$0.00032 USD**. Isso porque ele tem que executar 2 loops pra contar quem acertou todos os navios do adversário:

```rust
fn main(
    // Jogador 1
    ships_player: [(u8, u8, u8, bool); 5],  // navios do jogador 1 (SECRETO)
    attacks_player: pub [(u8, u8); 100],    // todos os ataques do jogador 1
    board_hash_player: pub Field,
    n_attacks_player: pub u8,
    nonce_player: Field,

    // Jogador 2 (AI)
    ships_ai: [(u8, u8, u8, bool); 5],      // navios do jogador 2 (SECRETO)
    attacks_ai: pub [(u8, u8); 100],        // todos os ataques do jogador 2
    board_hash_ai: pub Field,
    n_attacks_ai: pub u8,
    nonce_ai: Field,

    // Partida
    ship_sizes: pub [u8; 5],
    winner: pub u8,                         // jogador 1 ou jogador 2
) {
    // Verifica os dois tabuleiros
    assert(compute_board_hash(ships_player, nonce_player) == board_hash_player);
    assert(compute_board_hash(ships_ai, nonce_ai) == board_hash_ai);

    // Conta hits do jogador 1
    let mut hits_on_player: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_ai {
            let (row, col) = attacks_ai[i];
            if cell_is_hit(ships_player, row, col) {
                hits_on_player += 1;
            }
        }
    }

    // Conta hits do jogador 2 (AI)
    let mut hits_on_ai: u8 = 0;
    for i in 0..100 {
        if (i as u8) < n_attacks_player {
            let (row, col) = attacks_player[i];
            if cell_is_hit(ships_ai, row, col) {
                hits_on_ai += 1;
            }
        }
    }

    // 5+4+3+3+2 = 17 células de navio no total
    let total_ship_counter = 17;
    
    // O vencedor declarado realmente venceu?
    if winner == 0 {
        // P1 afundou todos os navios de P2?
        assert(hits_on_ai == total_ship_counter);
    } else {
        // P2 afundou todos os navios de P1?
        assert(hits_on_player == total_ship_counter);
    }
}
```

---

## Integrando os Circuitos

> Com os três circuitos prontos, o próximo passo era entender onde e como eles rodam.

Agora que o circuito está pronto, ele precisa receber os dados para começar a gerar as provas. Mas onde essa linguagem roda? Node.js? Rust? No browser?

Vou comparar o ciclo de vida dos circuitos ao dos contratos inteligentes e, se você é de web2, com as functions-as-a-service:

**Web2 - Functions-as-a-Service:**
```
Escrever → Compilar → Testar → Deploy na Nuvem → Interagir (cold start)
```

**Web3 - Smart-contracts:**
```
Escrever → Compilar → Testar → Deploy na Blockchain (EVM/Soroban) → Interagir (gas fee)
```

**Web3 ZK - Circuitos:**
```
Escrever → Compilar → Testar → Importar no cliente → Interagir (CPU) → Output (prova)
```

Diferente da Web2 e Web3, os circuitos **não devem ser executados no lado do servidor**. Para pra pensar: se você tem que enviar os dados para o servidor para gerar uma prova com inputs secretos, você já revelou seus dados para a rede e para o servidor.

Por isso os circuitos devem ser compilados e injetados no cliente assim como uma biblioteca WASM ou um asset js que é executado no cliente.

Depois de escrever os circuitos, a compilação gera um binário executável capaz de gerar provas dinamicamente com inputs secretos. Mas a compilação gera outro artefato importante: a **Verification Key (VK)**.

A VK é a metade pública do circuito, ela contém tudo que um verificador precisa para confirmar que uma prova é legítima, sem precisar do circuito completo nem dos dados secretos. No meu projeto, as VKs dos circuitos do tabuleiro e da partida são embarcadas dentro do contrato inteligente Soroban que as usa para verificar as provas on-chain. Já o circuito de ataque fica apenas no backend pois ele é verificado off-chain.

Para gerar uma prova a partir de um circuito Noir, você precisa de dois componentes:

- **NoirJS** (`@noir-lang/noir_js`): executa o circuito e gera a **witness**
- **bb.js** (`@aztec/bb.js`): pega a witness e gera a prova

> **O que é a witness?** É o conjunto de todos os valores intermediários do circuito durante a execução — como um rastro completo de cada fio do circuito. A prova é gerada a partir dessa witness.

No Node.js, funciona assim:

```javascript
// Importa as libs
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

// Importa o circuito como binário executável
const binary = fs.readFileSync('board_validity.json', 'utf-8');
const circuit = JSON.parse(binary);

// Instancia o circuito
const backend = new UltraHonkBackend(circuit.bytecode);
const noir = new Noir(circuit);

// Gera witness (executa o circuito com os inputs secretos)
const { witness } = await noir.execute({
    ships: [[0, 0, 5, true], [2, 0, 4, true], ...],
    nonce: "12345",
    board_hash: "0x07488bfc...",
    ship_sizes: [5, 4, 3, 3, 2],
});

// Gera a prova: um artefato Uint8Array de 14592 bytes
const proof = await backend.generateProof(witness, { keccak: true });
```

A flag `{ keccak: true }` é importante — ela gera provas compatíveis com verificação on-chain.

---

## Mobile ZK

> O Node.js funcionou. O próximo desafio: rodar isso num app mobile.

No backend (Node.js), isso funcionou de primeira. Mas o plano era gerar provas no cliente, que no meu caso seria o app mobile. O jogador posiciona os navios, o app gera a prova localmente, e envia pro backend só a prova (nunca as posições).

E aqui começou a diversão.

O `bb.js` usa WebAssembly pesado. Ele carrega binários de megabytes para fazer operações criptográficas. No Node.js e no browser, isso funciona porque ambos têm suporte maduro a WASM. Mas o React Native...

O React Native não roda num browser. Ele roda num runtime JavaScript próprio (Hermes ou JSC) que não tem suporte completo a WebAssembly. O `bb.js` precisa de WASM threads, memória compartilhada, e APIs que simplesmente não existem no runtime do React Native.

Tentei várias abordagens:

**Tentativa 1: importar bb.js direto no React Native. (GAMB)**
Falhou imediatamente. WebAssembly não existe no Hermes.

**Tentativa 2: WebView invisível. (MASTER GAMB)**
A ideia: criar um `<WebView>` transparente que carrega uma página HTML com o `bb.js`, e comunicar via `postMessage`. O WebView roda num engine de browser real, então WASM deveria funcionar.

```tsx
// zk/adapter.tsx — WebView provider
<WebView
    source={{ html: zkWorkerHtml }}
    onMessage={(event) => {
        const result = JSON.parse(event.nativeEvent.data);
        // Prova gerada!
    }}
/>
```

Isso quase funcionou. Me iludi achando que as provas "só estavam lentas", que "depois eu refino". Esperei por 20 minutos a geração das provas e nada, só queimando memória e CPU. E a comunicação via `postMessage` adicionava latência extra ainda.

**Tentativa 3: downgrade de versões.**
Pensei que talvez uma versão mais antiga do `bb.js` fosse mais leve. Testei `bb.js 0.72.1` com `noir_js beta.2`. Ainda não rodava no React Native.

---

## A Decisão Dolorosa

> Com três tentativas fracassadas, chegou a hora de aceitar o custo da decisão anterior.

Olhei pro app mobile. 14 telas. Animações + vibração como reação. Splash screen animado com radar, modelo 3D do navio, confettis...

Enfim, mandei o Claude Code migrar tudo para um cliente web reaproveitando tudo que pudesse. Usei Vite + React bem básico pra fazer tudo funcionar no browser.

O browser é um ambiente estável hoje e você consegue executar várias coisas de forma nativa como WASM e outras APIs de criptografia. Tudo funcionou e não perdi tanto a beleza do app.

O aprendizado técnico foi sobre como trabalhar os imports no browser para carregar o circuito e as bibliotecas corretamente:

```javascript
// 1. Importar os circuitos compilados como JSON estático
import boardValidityCircuit from './circuits/board_validity.json';
import shotProofCircuit from './circuits/shot_proof.json';
import turnsProofCircuit from './circuits/turns_proof.json';

// 2. Importar as libs de forma dinâmica (WASM pesado, não pode ser bundled)
const [noirMod, bbMod] = await Promise.all([
  import('@noir-lang/noir_js'),
  import('@aztec/bb.js'),
]);

// 3. Instanciar o circuito com NoirJS
const noir = new noirMod.Noir(boardValidityCircuit);

// 4. Executar o circuito e gerar a prova
const { witness } = await noir.execute(inputs);
const backend = new bbMod.UltraHonkBackend(boardValidityCircuit.bytecode);
const { proof, publicInputs } = await backend.generateProof(witness, { keccak: true });
```

Os circuitos compilados (`.json`) são importados como assets estáticos, o Vite resolve isso no build. Já o NoirJS e bb.js são importados dinamicamente porque carregam WASM pesado que não pode ser pré-bundled (no `vite.config.ts` eles ficam no `optimizeDeps.exclude`).

Aqui tem outro aprendizado, agora não técnico.

**Eu deveria ter escrito um circuito hello world e validado que era possível gerar a prova no mobile no dia 0, antes de começar a perfumaria.** Mas eu me apaixonei.

Me apaixonei porque foi uma das experiências mais legais de programação que eu tive. Num jogo é super divertido testar as coisas porque você está jogando enquanto programa, bem diferente de ficar testando tela de cadastro ou ver se o docker vai compilar certo dessa vez.,,

---

## O que temos até aqui

Ao final dessa fase:

- 3 circuitos Noir compilados e testados (`board_validity`, `shot_proof`, `turns_proof`)
- 100% compatível com Stellar Protocol 25 (Poseidon2 + BN254)
- Circuitos gerando provas no cliente web (browser + bb.js + NoirJS)

Os circuitos estavam prontos. As provas estavam sendo geradas. Mas ninguém ainda as estava verificando — nem o backend, nem a blockchain.

Isso é o próximo capítulo.

---

← [Parte 1 — "O que eu me meti?"](#)
→ [Parte 3 — "A blockchain que verificou a prova"](#)