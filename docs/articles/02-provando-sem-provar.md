# Diário de Bordo: ZK Battleship

## Parte 2 — "Provando sem mostrar"

*Escrevendo circuitos ZK em Noir, escolhendo Poseidon2, e descobrindo que o app mobile lindo não roda provas*

---

### 21 de fevereiro: hora de aprender ZK de verdade

O jogo single-player estava pronto. Bonito, jogável, com 14 telas e animações. Mas até agora não tinha uma única linha de código ZK. O hackathon fechava em 2 dias. Era hora de mergulhar.

Meu primeiro problema: **como você escreve uma prova zero-knowledge?**

Você não escreve a prova diretamente. Você escreve um **circuito** — um programa que descreve as regras que a prova precisa satisfazer. Depois, uma ferramenta matemática gera a prova a partir do circuito e dos dados de entrada.

Pensa assim: o circuito é o contrato. A prova é a assinatura. Quem verifica a prova está confirmando que alguém executou o circuito corretamente com entradas válidas, sem ver quais eram as entradas.

---

### Noir: a linguagem dos circuitos

Existem várias linguagens para escrever circuitos ZK: Circom, Cairo, Noir, entre outras. Escolhi **Noir** (da Aztec) por três razões:

1. A sintaxe parece Rust — familiar o suficiente para não ter que aprender uma linguagem alienígena
2. Tem toolchain moderna: `nargo` para compilar e testar, `bb.js` para gerar provas em JavaScript
3. O sistema de provas (UltraHonk) é compatível com a curva BN254 — a mesma que o Protocol 25 da Stellar suporta nativamente

Instalar é direto:

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup -v 1.0.0-beta.9
```

---

### O primeiro circuito: board_validity

O circuito mais importante é o primeiro: provar que seu tabuleiro é válido sem revelar onde estão os navios.

O que ele precisa verificar:
1. Os navios têm os tamanhos corretos (5, 4, 3, 3, 2)
2. Nenhum navio sai dos limites do tabuleiro 10x10
3. Nenhum navio se sobrepõe a outro
4. O hash do tabuleiro bate com um compromisso público

Aqui está o circuito real, em Noir:

```noir
use poseidon::poseidon2::Poseidon2;

fn main(
    ships: [(u8, u8, u8, bool); 5],      // posições secretas dos navios
    nonce: Field,                          // número aleatório secreto
    board_hash: pub Field,                 // compromisso público
    ship_sizes: pub [u8; 5],              // tamanhos esperados (público)
) {
    // 1. O hash bate?
    let computed_hash = compute_board_hash(ships, nonce);
    assert(computed_hash == board_hash, "board hash inválido");

    // 2. Tamanhos corretos?
    for i in 0..5 {
        let (_, _, size, _) = ships[i];
        assert(size == ship_sizes[i], "tamanho de navio inválido");
    }

    // 3. Dentro dos limites?
    for i in 0..5 {
        let (row, col, size, horizontal) = ships[i];
        assert(ship_in_bounds(row, col, size, horizontal));
    }

    // 4. Sem sobreposição?
    for i in 0..5 {
        for j in (i + 1)..5 {
            assert(!ships_overlap(ships[i], ships[j]));
        }
    }
}
```

Observe a palavra-chave `pub`. Inputs marcados com `pub` são **públicos** — qualquer um pode vê-los. Inputs sem `pub` são **privados** — só quem gera a prova conhece.

`ships` e `nonce` são privados: ninguém sabe onde seus navios estão nem qual número aleatório você usou. `board_hash` e `ship_sizes` são públicos: todos podem verificar que a prova foi gerada contra esse hash específico e com esses tamanhos de navio.

---

### A função de hash: Poseidon2

Um detalhe que parece pequeno mas é uma das decisões mais importantes do projeto: qual função de hash usar.

No mundo normal, você usaria SHA-256. Segura, testada, onipresente. Eu comecei com SHA-256 (commit `5253a32`: `feat(crypto): add board commitment types and SHA-256 hashing`). Mas dentro de um circuito ZK, SHA-256 é **extremamente cara**. Cada operação bitwise vira milhares de constraints no circuito, tornando a prova lenta para gerar.

**Poseidon2** é uma função de hash desenhada especificamente para circuitos ZK. Ela opera sobre campos finitos (os números naturais dos circuitos) em vez de bits, o que a torna ordens de grandeza mais eficiente dentro de um circuito.

```noir
fn compute_board_hash(
    ships: [(u8, u8, u8, bool); 5],
    nonce: Field
) -> Field {
    let mut inputs: [Field; 21] = [0; 21];
    for i in 0..5 {
        let (r, c, s, h) = ships[i];
        inputs[i * 4 + 0] = r as Field;    // linha
        inputs[i * 4 + 1] = c as Field;    // coluna
        inputs[i * 4 + 2] = s as Field;    // tamanho
        inputs[i * 4 + 3] = if h { 1 } else { 0 }; // orientação
    }
    inputs[20] = nonce;  // sal aleatório
    Poseidon2::hash(inputs, 21)
}
```

5 navios x 4 campos cada = 20 inputs, mais 1 nonce = 21 valores. O Poseidon2 comprime tudo num único `Field` (um número de 254 bits). Esse é o compromisso público do tabuleiro.

O `nonce` é crucial: sem ele, alguém poderia tentar todas as combinações possíveis de tabuleiro e comparar com o hash público. O nonce torna isso impossível — é um sal aleatório que só você conhece.

E aqui vem o bônus: a Stellar implementou Poseidon2 como **instrução nativa** no Protocol 25. Isso significa que quando verificamos o hash on-chain, não estamos executando código de smart contract — estamos usando uma operação do próprio protocolo. Rápido e barato.

---

### O segundo circuito: shot_proof

Com o tabuleiro comprometido, precisamos provar que cada resposta durante o jogo é honesta.

Quando meu oponente ataca a coordenada (3, 5) do meu tabuleiro, eu digo "acertou" ou "errou". Mas como ele sabe que eu não estou mentindo?

```noir
fn main(
    ships: [(u8, u8, u8, bool); 5],  // minhas posições (SECRETAS)
    nonce: Field,                      // meu nonce (SECRETO)
    board_hash: pub Field,             // meu compromisso (PÚBLICO)
    row: pub u8,                       // coordenada atacada
    col: pub u8,
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

O circuito faz duas coisas:
1. Verifica que o hash bate — ou seja, estou usando o mesmo tabuleiro do início
2. Verifica que a resposta condiz com a realidade — se tem navio naquela célula, tem que ser "hit"

Se eu tentar mentir (dizer "miss" quando tem navio), o `assert` falha e a prova não pode ser gerada. **Mentir é matematicamente impossível.**

---

### O terceiro circuito: turns_proof

O circuito final é o mais ambicioso: fazer o replay da partida inteira e calcular o vencedor.

```noir
fn main(
    ships_player: [(u8, u8, u8, bool); 5],  // navios do jogador 1 (secreto)
    ships_ai: [(u8, u8, u8, bool); 5],      // navios do jogador 2 (secreto)
    nonce_player: Field,
    nonce_ai: Field,
    board_hash_player: pub Field,
    board_hash_ai: pub Field,
    attacks_player: pub [(u8, u8); 100],     // todos os ataques do P1
    attacks_ai: pub [(u8, u8); 100],         // todos os ataques do P2
    n_attacks_player: pub u8,
    n_attacks_ai: pub u8,
    ship_sizes: pub [u8; 5],
    winner: pub u8,                           // 0 = P1, 1 = P2
) {
    // Verifica os dois tabuleiros
    assert(compute_board_hash(ships_player, nonce_player) == board_hash_player);
    assert(compute_board_hash(ships_ai, nonce_ai) == board_hash_ai);

    // Conta hits em cada tabuleiro
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

    // O vencedor declarado realmente venceu?
    let cells_to_win = total_ship_cells(ship_sizes); // 5+4+3+3+2 = 17
    if winner == 0 {
        assert(hits_on_ai == cells_to_win);   // P1 afundou todos os navios de P2
    } else {
        assert(hits_on_player == cells_to_win); // P2 afundou todos os navios de P1
    }
}
```

Esse circuito é o árbitro final. Ele recebe toda a história da partida — todos os ataques dos dois jogadores — e recalcula quem ganhou. Se alguém tentar declarar o vencedor errado, a prova falha.

O array de 100 ataques é fixo (circuitos ZK não suportam tamanho variável). Os slots não usados são preenchidos com `(0, 0)` e ignorados via o contador `n_attacks`.

---

### Testando os circuitos

Noir tem suporte a testes embutido. Cada circuito inclui testes que verificam cenários válidos e inválidos:

```noir
#[test]
fn test_valid_board() {
    let ships: [(u8, u8, u8, bool); 5] = [
        (0, 0, 5, true),   // Carrier na linha 0, horizontal
        (2, 0, 4, true),   // Battleship na linha 2
        (4, 0, 3, true),   // Cruiser na linha 4
        (6, 0, 3, true),   // Submarine na linha 6
        (8, 0, 2, true),   // Destroyer na linha 8
    ];
    let nonce: Field = 12345;
    let board_hash = compute_board_hash(ships, nonce);
    let ship_sizes: [u8; 5] = [5, 4, 3, 3, 2];
    main(ships, nonce, board_hash, ship_sizes); // não deve falhar
}

#[test(should_fail)]
fn test_lying_miss_when_hit() {
    // Tentando dizer "miss" numa célula que tem navio
    main(ships, nonce, board_hash, 0, 0, false); // DEVE falhar
}
```

```bash
nargo test
```

Todos passando. Os circuitos funcionam. Agora preciso gerar provas de verdade.

---

### Gerando provas: bb.js e o problema do React Native

Para gerar uma prova a partir de um circuito Noir, você precisa de dois componentes:

1. **NoirJS** (`@noir-lang/noir_js`): executa o circuito e gera a "witness" (os valores intermediários)
2. **bb.js** (`@aztec/bb.js`): pega a witness e gera a prova criptográfica usando UltraHonk

No Node.js, funciona perfeitamente:

```typescript
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

const circuit = JSON.parse(fs.readFileSync('board_validity.json', 'utf-8'));
const backend = new UltraHonkBackend(circuit.bytecode);
const noir = new Noir(circuit);

// Gera witness (executa o circuito com os inputs)
const { witness } = await noir.execute({
    ships: [[0, 0, 5, true], [2, 0, 4, true], ...],
    nonce: "12345",
    board_hash: "0x07488bfc...",
    ship_sizes: [5, 4, 3, 3, 2],
});

// Gera prova
const proof = await backend.generateProof(witness, { keccak: true });
// proof.proof: Uint8Array de 14592 bytes
```

A flag `{ keccak: true }` é importante — ela gera provas compatíveis com verificação on-chain.

No backend (Node.js), isso funcionou de primeira. Mas o plano era gerar provas **no cliente** — no app mobile. O jogador posiciona os navios, o app gera a prova localmente, e envia pro backend só a prova (nunca as posições).

E aqui começou o pesadelo.

---

### O muro: bb.js no React Native

O `bb.js` usa **WebAssembly** pesado. Ele carrega binários de megabytes para fazer operações criptográficas. No Node.js e no browser, isso funciona porque ambos têm suporte maduro a WASM. Mas o React Native...

O React Native não roda num browser. Ele roda num runtime JavaScript próprio (Hermes ou JSC) que não tem suporte completo a WebAssembly. O `bb.js` precisa de WASM threads, memória compartilhada, e APIs que simplesmente não existem no runtime do React Native.

Tentei várias abordagens:

**Tentativa 1: importar bb.js direto no React Native.**
Falhou imediatamente. `WebAssembly` não existe no Hermes.

**Tentativa 2: WebView invisível.**
A ideia: criar um `<WebView>` escondido que carrega uma página HTML com o bb.js, e comunicar via `postMessage`. O WebView roda num engine de browser real, então WASM funciona.

```typescript
// zk/adapter.tsx — WebView provider
<WebView
    source={{ html: zkWorkerHtml }}
    onMessage={(event) => {
        const result = JSON.parse(event.nativeEvent.data);
        // prova gerada!
    }}
/>
```

Isso quase funcionou. Mas as provas demoravam demais — o WebView tem limitações de memória e CPU. E a comunicação via `postMessage` adicionava latência. Em testes, gerar uma `board_validity` proof levava mais de 30 segundos no celular. Inviável para um jogo.

**Tentativa 3: downgrade de versões.**
Talvez uma versão mais antiga do bb.js fosse mais leve? Commit `e78a543`: `fix(backend): downgrade bb.js and noir_js to compatible versions`. Testei bb.js 0.72.1 com noir_js beta.2. Ainda não rodava no React Native.

---

### A decisão dolorosa

Olhei pro app mobile. 14 telas. Animações com Reanimated. Haptics. Internacionalização em 3 idiomas. Splash screen animado, modelo 3D de navio no menu, confetti na vitória. Um app bonito que levou dias para polir.

E olhei pro bb.js que se recusava a rodar nele.

A decisão: **abandonar o mobile-only e fazer um cliente web.**

O web (Vite + React) roda num browser real. WASM funciona. bb.js funciona. Tudo funciona. Não seria tão bonito quanto o app nativo, mas seria funcional.

Commit `f63324b`: `feat(web): merge wallet creation into login flow`. O cliente web começou a nascer, espelhando as funcionalidades do mobile mas com a vantagem crítica de poder gerar provas ZK.

O app mobile continuou existindo — para single-player e como referência visual. Mas o PvP com ZK seria web-only.

---

### A lição aqui

Se eu pudesse voltar no tempo, testaria o bb.js no React Native no **primeiro dia**. Antes de fazer 14 telas. Antes de polir animações. A integração mais arriscada do projeto deveria ter sido testada primeiro.

Mas é fácil falar isso depois. No momento, o jogo single-player era motivação pura — ver algo funcionando, bonito, jogável. E essa motivação me carregou até o ponto em que o ZK precisava funcionar.

---

### O que temos até aqui

Ao final dessa fase:

- 3 circuitos Noir compilados e testados (`board_validity`, `shot_proof`, `turns_proof`)
- Poseidon2 como função de hash (compatível com Stellar Protocol 25)
- Provas gerando no Node.js e no browser (bb.js + NoirJS)
- App mobile bonito mas sem ZK
- Cliente web funcional com geração de provas

Os circuitos estavam prontos. As provas estavam sendo geradas. Mas ninguém ainda as estava **verificando** — nem o backend, nem a blockchain.

Isso é o próximo capítulo.

---

*Anterior: [Parte 1 — "O que eu me meti?"](./01-o-que-eu-me-meti.md)*
*Próximo: [Parte 3 — "A blockchain que verificou a prova"](./03-a-blockchain-que-verificou.md)*
