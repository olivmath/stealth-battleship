# Review Adversarial -- Battleship ZK (v3)

**Tipo de conteudo:** Codebase completa da aplicacao (React Native / Expo)
**Escopo da revisao:** Qualidade de codigo, design, algoritmos, game balance, extensibilidade
**Data:** 2026-02-07

---

## Achados

### 1. SIDE EFFECTS VAZAM PARA A CAMADA DE APRESENTACAO -- Violacao de Arquitetura

`battle.tsx` e `gameover.tsx` chamam `updateStatsAfterGame()` e `saveMatchToHistory()` diretamente dentro do corpo dos componentes. Isso significa que seus componentes de tela estao fazendo I/O -- uma violacao clara da arquitetura em camadas que voce montou. O reducer deveria ser dono de todas as transicoes de estado, e a persistencia deveria ser tratada por um middleware ou camada de efeitos. Atualmente, as stats escritas no AsyncStorage **nao sao despachadas de volta para o context**, criando uma janela de drift de estado onde o context em memoria mostra dados desatualizados ate a proxima tela carregar e chamar `refresh()`. Isso e um bug esperando acontecer se voce algum dia navegar de volta para uma tela que le do context em vez de re-buscar do storage.

### 2. ZERO TRATAMENTO DE ERRO EM TODAS AS OPERACOES DE STORAGE -- Risco de Crash

`storage/scores.ts` faz `JSON.parse(data)` em toda leitura sem um unico `try/catch`. Se o AsyncStorage retornar dados corrompidos (o que acontece em dispositivo real, especialmente apos crashes durante escritas), sua app vai crashar com uma excecao nao tratada. `getPlayerName` faz `JSON.parse(data).name` -- se o schema mudar ou os dados estiverem malformados, crash instantaneo. Nao existe um componente de error boundary global em lugar nenhum da app. Um parse mal-sucedido e o usuario ve uma tela branca sem caminho de recuperacao.

### 3. `react-native-reanimated` E `react-native-worklets` SAO DEPENDENCIAS FANTASMA

Estao listados no `package.json` mas **nunca sao importados em lugar nenhum do codigo**. Toda animacao na app usa o `Animated` nativo do React Native. Voce esta embarcando peso morto -- `reanimated` adiciona tamanho significativo ao bundle e complexidade de build nativo para literalmente zero beneficio. O MEMORY.md ate lista "Reanimated tilt+slide sinking effect" e "Reanimated rotating sweep line" como features, mas as implementacoes reais em `SunkShipModal.tsx` e `RadarSpinner.tsx` usam `Animated` do `react-native`, nao o Reanimated. Sua documentacao mente sobre seu proprio codigo.

### 4. `KillEfficiencyBar` ESTA COPIADO-E-COLADO ENTRE DOIS ARQUIVOS -- Violacao DRY

O componente `KillEfficiencyBar` identico existe tanto em `gameover.tsx` (linhas 15-60) quanto em `match-detail.tsx` (linhas 11-42). Mesmas props, mesmos estilos, mesma logica. Este e o exemplo classico de componente que deveria estar em `src/components/UI/`. Quando voce inevitavelmente quiser mudar a aparencia da barra, vai atualizar um arquivo e esquecer o outro.

### 5. CORES HARDCODED FORA DO SISTEMA DE TEMA -- Inconsistencia de Design

Voce construiu um sistema de tema adequado em `constants/theme.ts` com `COLORS` e `FONTS` -- e depois o ignorou em multiplos lugares:
- `Cell.tsx`: `'#38bdf8'`, `'#e2e8f0'` (marcadores de miss)
- `NavalButton.tsx`: `'#22c55e'` (variante success, hardcoded duas vezes)
- `MiniGrid.tsx`: `'#ff6b6b'`, `'#64748b'`, `'#991b1b'`
- `match-history.tsx`: objeto `DIFFICULTY_COLORS` com 3 valores hex hardcoded
- Texto de vitoria usa `COLORS.accent.victory` no gameover mas `COLORS.accent.gold` no match-detail

Se voce algum dia quiser implementar temas (dark/light) ou ajustar a paleta, vai ter que cacar hex codes renegados arquivo por arquivo. O sistema de tema so e tao bom quanto sua aplicacao consistente.

### 6. FALHAS DE CONTRASTE E ACESSIBILIDADE

Apesar do codebase ter boa cobertura de `accessibilityLabel`, existem problemas concretos:
- O marcador de miss e `'#38bdf8'` (azul claro) sobre fundo `'#0a1628'` (navy escuro) -- passa no contraste, mas o ponto e minusculo e dificil de ver em telas pequenas
- Os badges de dificuldade no match-history usam **diferenciacao apenas por cor** (texto verde/dourado/vermelho) sem icone ou indicador de forma -- falha WCAG para daltonicos
- `TurnIndicator` usa pontos animados (`...`) para indicar "inimigo atirando" -- nao e amigavel para screen reader; o label diz "Enemy is firing" mas a animacao e ruido decorativo para VoiceOver
- Nenhuma verificacao de `reducedMotion` em lugar nenhum -- todas as animacoes tocam independente das preferencias de acessibilidade do usuario

### 7. PENALIDADE DE OVERKILL E CODIGO MORTO -- Buraco no Game Balance

`calculateScore` em `stats.ts` aceita um parametro `overkillShots` e deduz `overkillShots * 50` do score. Mas `computeMatchStats` na linha 81 hardcoda `0` para esse parametro. A formula de pontuacao finge penalizar tiros desperdicados mas nunca de fato o faz. Ou implemente o tracking de overkill (tiros em celulas ja atingidas) ou remova o parametro para parar de mentir para futuros desenvolvedores sobre como a pontuacao funciona.

### 8. CURVA DE DIFICULDADE DA IA E MAL BALANCEADA

- **Modo Easy** e puramente aleatorio (sem checkerboard, sem deteccao de eixo). Num grid 6x6 com 7 celulas de navio, uma IA aleatoria leva em media ~18 tiros para afundar tudo. O jogador com qualquer estrategia ganha 95%+ das vezes. Nao e "facil", e "brain-dead."
- **Modo Hard** adiciona targeting com peso pro centro, que favorece o meio do tabuleiro. Mas peso pro centro e uma vantagem marginal na melhor das hipoteses -- num grid 6x6, o bias pro centro mal importa ja que navios frequentemente tocam as bordas. A dificuldade real vem da reducao do delay da IA (400-700ms vs 1400-2000ms no easy), que cria *pressao de tempo* em vez de *dificuldade estrategica*. O multiplicador de dificuldade (0.5x/1.0x/1.5x) para score e o unico incentivo diferencial real.
- O abismo entre Easy e Normal e um canyon; o gap entre Normal e Hard e uma rachadura. Os niveis de dificuldade precisam de rebalanceamento.

### 9. PROGRESSAO DE XP/RANK E GRIND SEM RECOMPENSA

Chegar a Admiral requer ~60.000 XP. Com ~1.500 XP por vitoria normal, sao **40 vitorias** -- contra uma IA, num jogo single-player, sem nenhum conteudo novo desbloqueando em cada rank. Os ranks sao puramente cosmeticos (exibidos no perfil). Nao existem navios desbloqueáveis, skins de grid, efeitos de batalha, ou modificadores de gameplay vinculados ao rank. O sistema de progressao da a ilusao de profundidade mas nao entrega nenhuma recompensa intrinseca. Jogadores vao atingir Ensign ou Lieutenant e parar de se importar porque nada muda.

### 10. EXTENSIBILIDADE PARA ZK/WEB3/PVP ESTA ESTRUTURALMENTE BLOQUEADA

A arquitetura toma varias decisoes hostis ao futuro:

- **O board expoe todas as posicoes dos navios em memoria.** `state.opponentBoard` contem `shipId` completo em cada celula. Para PvP, isso e um vetor de trapaca -- qualquer inspetor de memoria revela a frota do oponente. Provas ZK exigem esconder esses dados atras de commitments, o que significa que o modelo de dados inteiro do board precisa ser repensado.
- **`GameState.ai` esta hardcoded no shape do estado.** Nao existe abstracao para "oponente" -- e literalmente `ai: AIState`. PvP requer substituir isso por um peer de rede, o que significa refatorar o reducer, context, e toda tela que referencia `state.ai`.
- **Nenhum padrao commit/reveal.** Battleship ZK precisa de: (1) commit do hash do board no placement, (2) em cada ataque, provar o resultado da celula sem revelar o board. Atualmente `processAttack` recebe o board completo como input e retorna o board mutado -- nao ha hash, nao ha prova, nao ha separacao entre estado privado e resultado publico.
- **`AIState.firedPositions` usa `Set<string>`** que nao pode ser serializado com JSON para transporte de rede ou inputs de prova sem serializacao customizada.
- **IDs de match sao `Date.now().toString()`** -- nao-deterministicos e propensos a colisao. Registros on-chain precisam de identificadores deterministicos e unicos.
- **Nenhuma abstracao de wallet/signer.** Adicionar web3 significa introduzir conexao de carteira, assinatura de transacoes, e sincronizacao de estado on-chain do zero -- nao existem hooks, types, ou patterns para construir em cima.

As funcoes puras do engine sao o unico ponto positivo -- elas poderiam teoricamente ser encapsuladas em circuitos ZK. Mas tudo ao redor delas (gerenciamento de estado, representacao do board, abstracao de oponente) precisa de refatoracao significativa antes que qualquer um dos objetivos declarados (provas ZK, PvP com staking, interacao com contratos) seja alcancavel.

### 11. ZERO TESTES -- Negligencia Profissional

Existem exatamente **zero arquivos de teste** no projeto inteiro. Nenhum. A camada de engine (`board.ts`, `ai.ts`, `shipPlacement.ts`, `stats.ts`) consiste de funcoes puras -- o codigo mais facil de testar que existe. A formula de pontuacao, calculo de rank, logica de targeting da IA, e validacao de placement sao todos criticos para corretude e completamente nao-verificados. Nao existe config de Jest, nem test runner, nem pipeline de CI. Se voce refatorar o engine para integracao ZK, nao tera rede de seguranca para detectar regressoes.

### 12. WEBVIEW DO MODELO 3D SEMPRE MONTADO -- DESPERDICIO DE MEMORIA

`_layout.tsx` monta um WebView escondido de 1x1 pixel que carrega um viewer de modelo 3D do Sketchfab em **toda tela da app**. Esse WebView persiste durante todo o ciclo de vida da aplicacao -- durante battle, gameover, settings, em todo lugar. Um WebView e um dos componentes que mais consomem memoria no React Native. O modelo so e visivel na tela de menu. Deveria ser carregado sob demanda e desmontado ao sair do menu.

### 13. DEEP-COPY DO BOARD EM CADA ATAQUE -- ALOCACAO DESNECESSARIA

`processAttack` em `board.ts` faz `board.map(row => row.map(cell => ({...cell})))` -- uma copia profunda completa do board inteiro -- em cada ataque individual. Para um grid 10x10, sao 100 spreads de objeto mais 10 spreads de array mais o spread do array externo. Com 2 boards e potencialmente 100+ ataques por partida, voce esta gerando centenas de objetos de vida curta. Esse e um imposto de pureza funcional que cria pressao no garbage collector em dispositivos moveis. Um update imutavel que copie apenas a row afetada seria mais eficiente mantendo as mesmas garantias.

---

## Resumo

A app e um MVP visual competente com uma camada de engine solida e padroes de UI consistentes. Mas tem problemas arquiteturais reais (side effects em componentes, zero tratamento de erro, dependencias fantasma, zero testes) que vao se compor rapidamente se voce tentar estender para ZK/PvP sem endereca-los primeiro. Os numeros de game balance sao funcionais mas o sistema de progressao e oco, e a curva de dificuldade precisa de trabalho. O codigo nao esta pronto para integracao web3 -- o modelo de estado fundamentalmente assume um contexto local, confiavel e single-player.
