# Relatório da fase Centro-Oeste

A fase foi criada como uma "caça ao tesouro" geográfica, com foco em identificar elementos do Cerrado e do Pantanal no mapa do Brasil Central. A estrutura principal está no componente da fase em `src/pages/phases/centerwest/CenterWestPhase.tsx`, e os dados das missões ficam em `src/data/missions/centerWestMission.ts`.

## 1. Como foi montada

A fase é composta por:

- 8 missões distintas, cada uma com:
  - nome
  - ícone
  - biome (Cerrado ou Pantanal)
  - dica textual
  - fato científico
  - dica de preservação
  - posição no mapa (x, y)
  - tamanho do ponto no mapa
- ordem aleatória em cada partida, gerada pela função `createCentroOesteMissionOrder()`

Essa lógica fica em `src/data/missions/centerWestMission.ts`, onde cada item representa um alvo que o jogador precisa descobrir no mapa.

## 2. Estrutura do jogo

A lógica da fase foi implementada em `src/pages/phases/centerwest/CenterWestPhase.tsx` com os seguintes estados:

- `intro`: tela inicial
- `starting`: início da partida
- `playing`: fase ativa
- `discovery`: descoberta correta com modal de explicação
- `saving`: salvando progresso
- `game-over`: derrota
- `complete`: vitória

O jogador começa com:

- 3 vidas
- 30 segundos por missão
- objetivo de encontrar 8 alvos

A fase usa também:

- contexto de pontuação, via `ScoreContext`
- controle de tentativas e sessão, via `useAttempt` e `SessionContext`
- telemetry para registrar eventos de acerto/erro/finalização

## 3. Mecânica principal

A dinâmica funciona assim:

1. O jogo inicia com uma tela de introdução e botão "Começar expedição".
2. A missão atual aparece com:
   - nome do alvo
   - pista textual
   - indicador de vidas
   - timer
3. O jogador clica no mapa ou em pontos de destaque.
4. Se clicar no ponto errado:
   - perde uma vida
   - recebe pontuação negativa
   - aparece um marcador de erro visual
5. Se clicar no alvo correto:
   - ganha pontos
   - marca como descoberto
   - abre um modal com o fato e a dica de preservação
6. Depois da descoberta, a próxima missão é carregada.
7. Quando todas as 8 missões são completadas, a fase finaliza e salva a conquista.

A parte do fluxo de jogo e da lógica de acerto/erro está centralizada no componente `src/pages/phases/centerwest/CenterWestPhase.tsx`.

## 4. Como o mapa foi montado

A fase usa uma imagem de fundo ilustrada para o Centro-Oeste e sobrepõe pontos clicáveis em posições percentuais do mapa.

- imagem de fundo: `src/assets/centro-oeste/mapa-centro-oeste.jpg`
- estrutura visual da fase: `src/pages/phases/centerwest/CenterWestPhase.css`

Cada alvo é representado por um botão em coordenadas percentuais:

- `left`
- `top`
- `width`
- `aspectRatio`

Isso permite que o ponto apareça no lugar certo sobre a ilustração, independentemente do tamanho da tela.

## 5. Elementos visuais e UX

A aparência da fase foi pensada para ficar em estilo de game educativo:

- barra de progresso com percentual de descoberta
- cards com informações da missão
- ícones de vidas em formato de coração
- álbum de descobertas com os 8 itens
- modal de "descoberta registrada"
- estado visual para derrota e vitória

Toda essa parte de estilo está em `src/pages/phases/centerwest/CenterWestPhase.css`.

## 6. Integração ao app

A fase foi registrada como rota do app:

- `src/App.tsx`

A rota configurada é:

- `/missao/centro-oeste`

Isso faz a fase aparecer dentro da navegação do jogo como uma missão do mapa.

## 7. Resumo final

Em resumo, a fase Centro-Oeste foi feita como uma missão de exploração visual e educativa, combinando:

- dados estruturados das espécies e elementos do bioma
- mapa interativo com hotspots
- timer, vidas e pontuação
- feedback de acerto/erro
- modal educativo com curiosidades e dicas de preservação
- integração com o sistema geral do jogo

Se quiser, posso também criar uma versão mais curta, mais formal, ou pronta para apresentação em slide.
