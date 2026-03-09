# Diário de Bordo: ZK Battleship

## Parte 1 — "O que eu me meti?"

*Como um dev que nunca fez jogos decidiu construir um Battleship com provas matemáticas numa blockchain*

---

### O hackathon

Fevereiro de 2026. A Stellar Foundation anuncia o **Stellar Hacks: ZK Gaming** — um hackathon para construir jogos on-chain usando zero-knowledge proofs. O prêmio? Reconhecimento, feedback de devs da Stellar, e a chance de mostrar que ZK não é só coisa de paper acadêmico.

Eu me inscrevi sem ter feito nenhum jogo na vida. Também nunca tinha escrito uma prova zero-knowledge. E meu contato com smart contracts era superficial. Mas eu sabia programar, sabia TypeScript, e tinha uma intuição: Battleship era o jogo perfeito para ZK.

Esse é o diário de como eu construí o **Stealth Battleship** em 17 dias, 331 commits, e 4 linguagens.

---

### O problema: alguém sempre vê os dois tabuleiros

Você conhece Batalha Naval. Dois jogadores, cada um com um tabuleiro. Você posiciona seus navios, o oponente posiciona os dele. Ninguém vê o tabuleiro do outro. Você ataca uma coordenada, o oponente diz "acertou" ou "errou".

Simples no mundo físico — cada jogador tem seu tabuleiro atrás de uma barreira. Mas no mundo digital, quem guarda os tabuleiros?

**Abordagem 1: o servidor vê tudo.**
O servidor sabe onde estão os navios dos dois jogadores. Funciona, mas você precisa confiar que o servidor não vai trapacear. Se o servidor quiser favorecer um jogador, ele pode. Você nunca saberia.

**Abordagem 2: commit-reveal.**
Cada jogador faz um hash do seu tabuleiro no início e publica esse hash. No final, revela o tabuleiro original e todos conferem se bate com o hash. Parece elegante, mas tem um furo fatal: se o jogador está perdendo, ele simplesmente desconecta. Nunca revela. Ninguém pode provar nada.

**Abordagem 3: tabuleiro on-chain.**
Coloca tudo na blockchain! Transparente e imutável. Exceto que... a blockchain é pública. Qualquer um pode ler a mempool e ver as transações antes de serem confirmadas. Seu oponente veria seus navios antes do jogo começar.

Nenhuma das três funciona. Todas falham por uma razão fundamental: **em algum momento, alguém vê informação que não deveria ver**.

---

### A ideia: e se ninguém precisasse ver?

Zero-Knowledge Proofs (ZK) resolvem exatamente isso. A ideia é simples de entender, mas profunda nas consequências:

> Eu consigo te **provar** que algo é verdade, **sem te mostrar** a informação que torna isso verdade.

Vamos com uma analogia. Imagine que eu tenho um cofre lacrado. Dentro dele tem um tabuleiro de Batalha Naval com 5 navios. Você não pode abrir o cofre. Mas eu te entrego um certificado matemático — uma **prova** — que diz:

1. O tabuleiro dentro do cofre tem exatamente 5 navios
2. Nenhum navio se sobrepõe a outro
3. Todos estão dentro dos limites do tabuleiro
4. O hash do conteúdo do cofre é `0x07488bfc167d2ba679...`

Você não sabe onde os navios estão. Mas você sabe que eles existem, são válidos, e que aquele hash representa esse tabuleiro específico. Se mais tarde eu disser "errou", você pode pedir outra prova — desta vez provando que naquela coordenada não tem navio, contra o mesmo hash.

**Se eu mentir, a matemática quebra. A prova não fecha. Trapacear é matematicamente impossível.**

---

### Aplicando ZK ao Battleship

Com essa ideia, o jogo funciona assim:

1. **Início**: cada jogador posiciona seus navios e gera uma prova de que o tabuleiro é válido. Essa prova é pública; o tabuleiro, não.

2. **Cada jogada**: quando eu ataco a coordenada (3, 5) do meu oponente, ele me diz "acertou" ou "errou" — e junto manda uma prova de que a resposta é honesta contra o tabuleiro original.

3. **Final**: quando todos os navios são afundados, a partida inteira é replayed dentro de um circuito que calcula o vencedor deterministicamente.

Ninguém nunca vê o tabuleiro do outro. Não tem servidor onisciente. Não tem reveal no final que pode ser evitado. A matemática garante tudo.

---

### Por que Stellar?

O hackathon era da Stellar, então a blockchain já estava definida. Mas descobri que não era só obrigação — era vantagem.

A Stellar acabou de lançar o **Protocol 25**, codinome **X-Ray**. Esse upgrade trouxe duas coisas que mudam tudo para ZK:

- **BN254 nativo**: operações de curva elíptica (a matemática por trás das provas ZK) rodando direto no protocolo, sem precisar reimplementar em smart contract
- **Poseidon2 nativo**: uma função de hash otimizada para circuitos ZK, também nativa no protocolo

Isso significa que verificar uma prova ZK na Stellar é ordens de grandeza mais barato do que em outras blockchains, porque as operações mais pesadas (multiplicação de pontos na curva, hashing) são instruções nativas, não smart contract code.

---

### O primeiro commit

7 de fevereiro de 2026. Commit `a2682d0`: **init**.

Comecei pelo que eu sabia: TypeScript, React Native, Expo. A ideia era fazer primeiro um jogo que funcionasse — single player contra IA — e depois ir adicionando as camadas de ZK e blockchain.

```
stealth-battleship/
  mobile/          # React Native / Expo
  circuits/        # (vazio por enquanto)
  backend/         # (vazio por enquanto)
  soroban/         # (vazio por enquanto)
```

Nos primeiros dois dias, eu tinha um jogo jogável: tabuleiro 6x6, 3 navios, IA com hunt/target algorithm, animações, haptics, ranking, histórico de partidas. 76 commits em 48 horas.

O jogo era bonito. Telas com estética naval escura, fontes Orbitron e Rajdhani, gradientes de azul marinho com detalhes em dourado. Tutorial, dificuldade configurável, internacionalização em 3 idiomas.

Mas era um jogo normal. Sem ZK. Sem blockchain. Sem nada que justificasse o hackathon.

A parte fácil tinha acabado.

---

### A timeline

Olhando para trás, o projeto teve 4 fases claras:

| Período | Foco | Commits |
|---------|------|---------|
| 7-8 fev | Jogo single-player completo | 107 |
| 14-15 fev | Pesquisa: ZK, Noir, Stellar Protocol 25 | 5 |
| 21-22 fev | Circuitos ZK + backend PvP | 100 |
| 23 fev | **O dia de 112 commits** — tudo junto, deploy, Soroban | 112 |

O dia 23 de fevereiro merece um asterisco. 112 commits num único dia. Foi o dia em que tudo precisava funcionar junto — provas ZK geradas no cliente, verificadas no backend, submetidas na blockchain, com dois jogadores reais se enfrentando via WebSocket. Cada fix levava a outro bug, que levava a outra descoberta.

Mas estou adiantando a história.

---

### O que vem pela frente

Nos próximos artigos, vou contar cada fase com código real, erros reais, e os momentos de "eureka" que fizeram o projeto funcionar:

- **Parte 2**: Escrevendo circuitos ZK em Noir — e descobrindo que o app mobile não roda bb.js
- **Parte 3**: Verificando provas na blockchain Stellar — e gastando 214 XLM procurando um bug
- **Parte 4**: Conectando dois jogadores em tempo real — e a avalanche de race conditions
- **Parte 5**: A lição que custou 214 XLM — o que eu aprendi e faria diferente

Se você nunca mexeu com ZK, blockchain, ou jogos — bom, eu também não tinha. Vamos juntos.

---

*Próximo: [Parte 2 — "Provando sem mostrar"](./02-provando-sem-mostrar.md)*
