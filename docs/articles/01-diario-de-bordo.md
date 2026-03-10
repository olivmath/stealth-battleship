# O Hackathon

Fevereiro de 2026. A Stellar Development Foundation anuncia o **Stellar Hacks: ZK Gaming** — um hackathon para construir jogos on-chain usando zero-knowledge proofs. O prêmio? Reconhecimento, feedback de devs da Stellar, e a chance de mostrar que ZK não é só coisa de paper acadêmico.

Eu me inscrevi sem nunca ter feito um jogo antes. Achei que seria só mais um projeto com smart contracts e talvez um pouco mais interessante porque tinha que implementar provas zero-knowledge. Na minha cabeça, escrever um Batalha Naval seria perfeito pra integrar com ZK.

Esse é o diário de como eu construí o **Stealth Battleship** em:

- **17 dias**
- **331 commits**
- **4 linguagens**

---

## Problema: Alguém sempre vê os dois tabuleiros.

<!-- imagem -->

Você conhece Batalha Naval. Dois jogadores, cada um com um tabuleiro. Você posiciona seus navios, o oponente posiciona os dele. Ninguém vê o tabuleiro do outro. Você ataca uma coordenada, o oponente diz "acertou" ou "errou".

Simples na vida real, onde cada jogador tem seu tabuleiro atrás de uma barreira. Mas no mundo digital, quem guarda os tabuleiros?

**Abordagem 1: o servidor vê tudo.** O servidor sabe onde estão os navios dos dois jogadores. Funciona, mas você precisa confiar que o servidor não vai trapacear. Se o servidor quiser favorecer um jogador, ele pode, e você nunca saberia.

**Abordagem 2: commit-reveal.** Cada jogador faz um hash do seu tabuleiro no início e publica esse hash. No final, revela o tabuleiro original e todos conferem se bate com o hash. Parece elegante, mas tem uma vulnerabilidade: se o jogador está perdendo, ele simplesmente desconecta. Nunca revela. Ninguém pode provar nada.

**Abordagem 3: tabuleiro on-chain.** Coloca tudo na blockchain! Verificável e imutável. Exceto que... a blockchain é pública. Qualquer um pode ler os blocos e ver as transações antes de serem confirmadas. Seu oponente veria seus navios antes do jogo começar.

Nenhuma das três funciona. Todas falham por uma razão fundamental: **em algum momento, alguém vê informação que não deveria ver**.

---

## Solução: E se ninguém precisasse ver?

<!-- imagem -->

Zero-Knowledge Proofs (ZK) resolvem exatamente isso. A ideia é simples de entender, mas profunda nas consequências:

> Eu consigo te **provar** que algo é verdade, **sem te mostrar** a informação que torna isso verdade.

Simples.

Imagine que eu estou preparando um pedido de casamento surpresa. Eu pedi pra você, que é um artesão, criar um anel de diamante. Mas você não pode mostrar o anel pra ninguém, nem mesmo pra mim, porque isso estragaria a surpresa.

Mesmo assim, você faz uma afirmação:

> *O diamante do anel é verdadeiro.*

Mas eu quero ter certeza de que isso é verdade. Só que ver o anel estragaria tudo.

Então eu levo o anel até um especialista em diamantes. Ele examina a pedra e, depois de fazer os testes necessários, me entrega um certificado dizendo:

> *O diamante analisado é verdadeiro.*
> *A pedra passou por todos os testes de autenticidade.*

Eu nunca vi:

- O anel.
- Os testes que poderiam revelar características sobre ele.
- O tamanho, formato, cor, valor ou qualquer outro detalhe sobre o anel.

Ainda assim, eu tenho uma prova. Eu tenho conhecimento zero sobre o anel, exceto pelo fato de que ele é verdadeiro.

**Eu tenho uma Prova e Conhecimento Zero sobre o fato.**
Se você mentir, o especialista vai descobrir. Trapacear é impossível.

---

## Aplicando ZK ao Batalha Naval

<!-- imagem -->

O diamante vai ser o tabuleiro e o especialista, a matemática. Com essa ideia, o jogo funciona assim:

1. **Início**: cada jogador posiciona seus navios e gera uma Prova ZK de que o tabuleiro é válido. Essa prova é pública; o tabuleiro, não.
2. **Cada jogada**: quando eu ataco a coordenada (3, 5) do meu oponente, ele me diz "acertou" ou "errou" — e junto manda uma Prova ZK de que a resposta é honesta contra o tabuleiro original.
3. **Final**: quando todos os navios são afundados, a partida inteira é reproduzida dentro de um circuito que calcula o vencedor deterministicamente e gera uma Prova ZK final.

Ninguém nunca vê o tabuleiro do outro. Não tem servidor onisciente. Não tem reveal no final que pode ser evitado. A matemática garante tudo.

---

## Mas ZK funciona na Stellar?

<!-- imagem -->

A Stellar acabou de lançar o **Protocol 25**, codinome **X-Ray**. Esse upgrade adicionou operações de criptografia avançada — **BN254**, **Poseidon2** e **BLS12-381** — direto no protocolo. Não em smart contracts. Não em L2. No protocolo em si.

Pra entender o impacto: verificar uma prova ZK exige operações matemáticas pesadas — multiplicação de pontos em curvas elípticas, hashing, pairings. Em outras blockchains, isso roda dentro de smart contracts, o que é lento e caro. Na Stellar, essas operações agora são instruções nativas do protocolo.

O resultado? Verificar uma Prova ZK na Stellar custa em torno de **$0.005 USD**. Ordens de grandeza mais barato do que em qualquer outra blockchain.

(Sim, eu pensei que era $30 USD. Explico esse erro na parte 3).

---

## O Primeiro Commit: 7 de fevereiro de 2026.

<!-- imagem -->

Depois de 48 horas, eu já tinha um jogo jogável:

- Tabuleiro 6x6 com 3 navios
- IA com hunt/target algorithm
- Animações, ranking, histórico de partidas.

O jogo estava bonito. Telas com estética naval escura, fontes Orbitron, gradientes de azul marinho com detalhes em dourado. Tutorial, dificuldade configurável, internacionalização em 3 idiomas.

Mas era um jogo normal. Sem ZK. Sem blockchain. Sem nada que justificasse o hackathon.

Olhando para trás, o projeto teve 4 fases claras:

| Período | Foco | Commits |
|---------|------|---------|
| 07-08 fev | Jogo single-player completo | 107 |
| 14-15 fev | Pesquisa: ZK, Noir, Stellar Protocol | 255 |
| 21-22 fev | Circuitos ZK + backend PvP | 100 |
| 23 fev | Deploy do backend, frontend e Soroban na testnet | 112 |

O dia 23 de fevereiro merece um asterisco. 112 commits num único dia. Foi o dia em que tudo precisava funcionar junto: Provas ZK geradas no cliente, verificadas no backend, submetidas na blockchain, com dois jogadores reais se enfrentando via WebSocket online.

Cada correção levava a outro bug, que levava a outra descoberta.

**DIVERSÃO GARANTIDA.**

Mas estou adiantando a história.

---

## Continua...

<!-- imagem -->

Nos próximos artigos, vou contar cada fase com código real, erros reais, e os momentos de "eureka" que fizeram o projeto funcionar:

- **Parte 2**: Escrevendo Provas ZK em Noir e descobrindo que o app mobile não roda Provas ZK (bb.js)
- **Parte 3**: Verificando Provas ZK na blockchain Stellar e gastando 214 XLM procurando um bug.
- **Parte 4**: Conectando dois jogadores em tempo real e a avalanche de race conditions.
- **Parte 5**: A lição que custou 214 XLM — o que eu aprendi e faria diferente.

Se você nunca mexeu com ZK, blockchain, ou jogos juntos — bom, eu também não tinha. Vamos juntos.

---

*Próximo: [Parte 2 — "Provando sem provar"](./02-provando-sem-mostrar.md)*
