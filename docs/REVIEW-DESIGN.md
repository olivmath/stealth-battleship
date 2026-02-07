# Review Adversarial -- UI/UX & Jornada do Usuario

**Tipo de conteudo:** Codebase completa (12 telas + 15 componentes)
**Foco:** Experiencia do usuario, fluxo de navegacao, feedback visual, consistencia, friccao
**Data:** 2026-02-07

---

## Achados

### 1. SPLASH DE 3 SEGUNDOS OBRIGATORIA SEM SKIP -- FRICCAO PURA

`index.tsx` forca o usuario a olhar "BATTLESHIP / ZERO KNOWLEDGE" com um RadarSpinner por **3 segundos fixos** antes de redirecionar para `/login`. Nao tem botao de skip. Nao tem tap-to-continue. No segundo acesso a app, o usuario ja sabe o nome do jogo -- ele quer jogar, nao assistir uma animacao. Para um jogador recorrente, sao 3 segundos mortos **toda vez** que abre a app. Isso viola a heuristica basica de "respeitar o tempo do usuario". Pior: se o usuario ja tem um nome salvo no AsyncStorage (retornando), ele ainda passa pelo splash E pela tela de login -- dois cliques desnecessarios para chegar ao menu.

### 2. TUTORIAL OBRIGATORIO A CADA PARTIDA -- DESTRUIDOR DE RETENCAO

O fluxo do menu e: `Start Battle -> tutorial -> placement`. O tutorial com 5 slides e exibido **toda vez** que o usuario inicia uma batalha, sem excecao. Nao ha flag `hasSeenTutorial` no AsyncStorage. Na terceira partida, o usuario ja decorou as regras. Na decima, ele odeia o SKIP TUTORIAL que precisa apertar toda vez. Isso e o tipo de friccao que faz usuario abandonar o app. O tutorial deveria ser mostrado uma unica vez (ou ter um toggle em settings).

### 3. `router.replace()` EM TUDO MATA A NAVEGACAO UTILITARIA

Toda navegacao usa `replace`, entao nao existe botao de voltar nativo. Para telas de gameplay (placement -> battle -> gameover) isso e correto. Mas para telas utilitarias como Settings, Profile, Match History e Match Detail, o usuario espera poder deslizar pra voltar (gesto de swipe-back no iOS) ou usar o botao de voltar do Android. Em vez disso, ele precisa achar e apertar "BACK TO BASE" toda vez. Match Detail usa `replace('/match-history')` pra voltar -- isso **recarrega toda a lista** ao inves de simplesmente voltar um nivel. Resultado: em dispositivo Android, o botao de hardware "back" **fecha a app** em vez de navegar pra tras, porque nao existe pilha de navegacao.

### 4. MENU E UMA PILHA DE 6 BOTOES SEM HIERARQUIA VISUAL

O menu tem: Start Battle, PvP Online, Your History, Profile, Settings, Logout. Seis botoes empilhados verticalmente com o mesmo peso visual. "Start Battle" (acao primaria que o usuario quer 90% do tempo) tem o mesmo tamanho e destaque que "Logout" (acao destrutiva raramente usada). Nao ha separacao por grupo, nao ha icones, nao ha affordance visual que diferencie acoes primarias de secundarias de destrutivas. O modelo 3D do Sketchfab ocupa um terco da tela entre o header e os botoes, empurrando as acoes pra baixo -- em telas menores, os botoes de baixo podem ficar abaixo do fold. O rank do usuario, XP e win rate (que estavam no PRD) **nao aparecem no menu** -- foram movidos para a tela de Profile, reduzindo a sensacao de progresso na tela principal.

### 5. NENHUM FEEDBACK VISUAL DURANTE O TURNO DO INIMIGO -- USUARIO FICA NO LIMBO

Quando o turno passa para a IA, o `TurnIndicator` muda para "ENEMY FIRING..." com um ponto vermelho. E so. O usuario fica olhando pra um grid estatico por 400ms a 2000ms (dependendo da dificuldade) sem nenhuma animacao de "processamento", sem highlight da celula que foi atacada antes do resultado, sem contagem regressiva, sem tensao. Comparado com jogos de batalha naval competidores, isso e inerte. O tiro da IA simplesmente aparece no grid como se tivesse sempre estado la. Nao ha animacao de impacto, nao ha flash, nao ha transicao de estado da celula. O hit e o miss surgem instantaneamente.

### 6. STACKED MODE EM 10x10 E ILEGIVEL

No modo stacked com grid 10x10, o grid principal do inimigo ocupa a maior parte da tela e o "mini-map" do jogador fica comprimido a 75% da largura do grid. Com 100 celulas em um mini-map, cada celula tem aproximadamente **3-4 pixels** de lado em telas de 375px. Isso e invisivel. O usuario nao consegue distinguir hits de misses no proprio board. A `FleetStatus` compact ao lado do mini-map usa cards tao pequenos que os indicadores de hit/alive/sunk sao quadrados de ~6px. O stacked mode foi projetado para 6x6 e nao escala para 10x10 -- mas o usuario pode selecionar 10x10 + stacked em settings sem nenhum aviso.

### 7. SWIPE MODE NAO TEM SWIPE

O "swipe mode" nao usa swipe. Sao dois botoes de tab ("ENEMY WATERS" / "YOUR WATERS") que alternam o board exibido. O nome "SWIPE" nas settings implica um gesto de deslizar, que e o padrao mental do usuario. Quando ele tenta swipear, nada acontece. O auto-switch no turno do inimigo (`setSwipeView('player')`) e bem pensado, mas a troca de volta para enemy apos 1 segundo (`setTimeout(() => setSwipeView('enemy'), 1000)`) pode pegar o usuario no meio de uma analise do proprio board. Ele esta olhando suas posicoes e o app troca sem pedir.

### 8. SUNK SHIP MODAL BLOQUEIA INTERACAO POR 2 SEGUNDOS

Quando um navio afunda, o `SunkShipModal` aparece como um Modal full-screen com backdrop escuro por **2 segundos fixos** (`setTimeout(() => setShowSunkModal(false), 2000)`). Nao da pra tocar pra fechar. Nao da pra ver o board atras dele. Em uma sequencia rapida (afundar 2 navios em poucos turnos), o modal aparece no meio do turno do inimigo, bloqueando a visao do que esta acontecendo. Pior: a animacao de sinking (tilt + slide) e lenta e sutil -- o usuario espera 2 segundos pra ver um retangulo inclinar e descer. Nao ha som, nao ha confetti parcial, nao ha satisfacao proporcional a conquista.

### 9. GAMEOVER ESCONDE AS INFORMACOES MAIS INTERESSANTES

A tela de gameover mostra score, accuracy, shots e ships survived como stats primarias. O **Battle Report** (kill efficiency, streak, first blood, perfect kills) -- que sao as metricas mais interessantes e educativas -- esta escondido atras de um accordion colapsado por padrao. O usuario medio nunca vai tocar "BATTLE REPORT". Os dados que ensinam o jogador a melhorar estao a um toque de distancia, e a maioria dos usuarios nao sabe que existem. Alem disso, o `KillEfficiencyBar` mostra "ideal/actual" com barras gold/red, mas a legenda aparece repetida em **cada barra** de cada navio, ocupando espaco vertical desnecessario.

### 10. PLAY AGAIN PULA O TUTORIAL MAS RESET NAO MUDA SETTINGS

O botao "PLAY AGAIN" no gameover faz `dispatch({ type: 'RESET_GAME' })` e navega direto para `/placement`, pulando o tutorial (bom). Mas "RETURN TO BASE" volta para o menu, e de la "START BATTLE" passa pelo tutorial de novo (ruim -- achado #2). Mais grave: se o usuario quer mudar de 6x6 para 10x10 entre partidas, ele precisa: gameover -> menu -> settings -> mudar -> voltar -> start battle -> skip tutorial -> placement. Sao **6 toques** pra mudar um setting entre partidas. Nao ha atalho no gameover ou no placement.

### 11. LOGOUT NAO LIMPA DADOS E NAO CONFIRMA

O botao LOGOUT no menu faz `router.replace('/login')` e nada mais. Nao limpa o nome do AsyncStorage, nao limpa stats, nao limpa context. Quando o usuario digita um novo nome no login, ele herda as stats do jogador anterior (wins, losses, XP, history). "Logout" implica desconectar o usuario atual, mas na pratica so navega pra outra tela. Pior: nao ha dialog de confirmacao -- um toque acidental leva direto pra tela de login.

### 12. NENHUMA ANIMACAO DE TRANSICAO ENTRE TELAS

Toda navegacao usa `animation: 'fade'` definido no `_layout.tsx`. Isso significa que **toda transicao** e um fade identico, sem relacao semantica com o contexto. Menu -> tutorial = fade. Placement -> battle = fade. Battle -> gameover = fade. Victory e defeat tem a mesma transicao. Nao ha build-up de tensao, nao ha celebracao visual na entrada do gameover. O confetti aparece apos o fade, nao durante. Para um jogo com estetica militar "polished", as transicoes sao generiticas e sem personalidade.

### 13. TEXTOS FIXOS EM INGLES SEM i18n -- USUARIO BRASILEIRO IGNORADO

Todo o texto da app esta hardcoded em ingles: "ENEMY WATERS", "YOUR TURN", "COMMANDER NAME", "DEPLOY FLEET", "SURRENDER", "BACK TO BASE". O proprietario do projeto e brasileiro (docs em portugues, contexto em PT-BR), mas a app nao tem nenhuma estrutura de internacionalizacao. Nao ha arquivo de strings, nao ha contexto de locale, nao ha sequer um flag pra trocar idioma. Se o publico-alvo inclui jogadores brasileiros (ou qualquer nao-anglofono), a barreira de idioma e uma friccao real.

### 14. MATCH HISTORY NAO TEM FILTRO, BUSCA OU PAGINACAO

A tela de historico e uma FlatList plana sem scroll infinito, sem filtro por resultado (W/L), sem filtro por grid size, sem filtro por dificuldade, sem ordenacao. Depois de 50 partidas, o usuario faz scroll infinito por uma lista linear tentando achar "aquela partida boa que fiz ontem no hard 10x10". Nao ha summary statistics no topo (total W/L, media de score). A lista mostra data, resultado, grid e score -- mas nao accuracy, que e a metrica que o usuario mais quer comparar.

### 15. ESTADO DE EMPTY/LOADING INCONSISTENTE ENTRE TELAS

- `match-detail.tsx` mostra "Loading..." como texto plano centralizado enquanto busca o match do AsyncStorage. Sem RadarSpinner, sem animacao.
- `login.tsx` retorna `null` durante loading -- tela completamente branca por um instante antes de montar.
- `menu.tsx` nao tem estado de loading -- se stats ou settings demoram a carregar, a tela renderiza com dados vazios/default e depois faz um "jump" quando os dados chegam.
- O RadarSpinner (componente bonito que existe pra isso) so e usado no splash e no font loading. Todas as outras telas com async loading ignoram ele.

---

## Resumo

A app tem uma estetica visual consistente e bem executada, mas a jornada do usuario e cheia de friccao desnecessaria. O tutorial repetitivo, a splash nao-pulavel, a navegacao sem back-gesture, o stacked mode ilegivel em 10x10, e a falta de animacoes de impacto durante a batalha criam uma experiencia que *parece* polida mas nao *flui* como deveria. O maior gap e entre a qualidade visual (boa) e a qualidade de interacao (fraca) -- o jogo e bonito de olhar mas cansativo de usar repetidamente.
