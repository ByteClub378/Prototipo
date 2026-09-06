# Fase Nordeste

## Visão geral

A fase Nordeste é uma missão interativa do **Aventura Regiões Brasil**. Ela apresenta perguntas sobre a cultura, a gastronomia, a natureza, o patrimônio histórico e as tradições dos estados nordestinos.

O jogador percorre seis níveis de dificuldade crescente, responde às perguntas, recebe feedback imediato e acumula pontos. Ao terminar o último nível, a região é marcada como concluída e a medalha do Nordeste é exibida.

## Acesso à fase

- Rota: `/missao/nordeste`
- Componente principal: `src/pages/phases/northeast/NordestePhase.tsx`
- Estilos: `src/pages/phases/northeast/NordestePhase.css`
- Catálogo de níveis: `src/data/missions/nordesteLevels.ts`
- Catálogo de perguntas: `src/data/missions/nordesteQuestions.ts`

A rota é registrada em `src/App.tsx` dentro do `AppLayout`, mantendo o cabeçalho, o placar e os demais elementos compartilhados da aplicação.

## Conteúdo criado

Foram cadastradas nove perguntas reutilizáveis, cada uma com:

- identificador único;
- ícone visual;
- enunciado;
- uma resposta correta e três alternativas incorretas;
- uma curiosidade exibida após o acerto ou quando o tempo termina;
- uma alternativa marcada para os níveis iniciais, que exibem apenas duas opções.

Os temas abordados são:

- Caatinga e mandacaru;
- frevo e forró;
- acarajé e tapioca;
- Festa de São João;
- Pelourinho;
- literatura de cordel;
- renda de bilro;
- Bumba meu boi;
- Parque Nacional da Serra da Capivara.

Cada alternativa também pode apresentar uma imagem temática carregada de URLs do Unsplash. No cartão, a imagem é acompanhada pelo ícone da pergunta e pelo texto da opção.

## Estrutura dos níveis

| Nível | Nome | Perguntas apresentadas | Alternativas | Cronômetro |
| --- | --- | ---: | ---: | --- |
| 1 | Introdução | 4 | 2 | Não |
| 2 | Quiz visual | 4 | 2 | Não |
| 3 | Mais alternativas | 6 | 4 | Não |
| 4 | Pegadinhas | 8 | 4 | Não |
| 5 | Contra o tempo | 6 | 4 | Sim |
| 6 | Desafio final | 9 | 4 | Sim |

As perguntas dos níveis 1 a 4 são selecionadas a partir dos mesmos nove itens do catálogo. Nos níveis configurados com `shuffleQuestions`, a ordem é sorteada a cada tentativa. Assim, a missão possui 37 apresentações de perguntas no total, embora utilize nove perguntas distintas.

### Regras específicas

- Níveis 1 e 2 mostram a resposta correta e apenas uma alternativa incorreta.
- Níveis 3 a 6 mostram as quatro alternativas cadastradas.
- Os níveis 2 a 6 embaralham a ordem das perguntas.
- O nível 5 usa tempos de 15, 13, 12, 11, 10 e 10 segundos.
- O nível 6 usa tempos progressivos de 12 a 8 segundos, conforme a posição da pergunta.
- O cronômetro só é iniciado depois que o banner de abertura do nível é dispensado.

## Fluxo de interação

1. O jogador entra na rota e vê o cabeçalho da missão, o nível atual e o placar.
2. Um `LevelBanner` apresenta o título, a instrução e o ícone do nível.
3. A pergunta é exibida em um `GameCard`, com categoria, estado relacionado e opções visuais.
4. Ao selecionar uma opção correta:
   - são adicionados 100 pontos;
   - o feedback exibe a curiosidade da pergunta;
   - o botão fica bloqueado durante a resolução;
   - a próxima pergunta é carregada após uma breve transição.
5. Ao selecionar uma opção incorreta, o jogador recebe uma mensagem e pode tentar novamente.
6. Quando o cronômetro termina, a resposta não pontua, a curiosidade é apresentada e a fase avança automaticamente.
7. Ao responder todas as perguntas, o nível é concluído. O jogador pode iniciar o próximo nível.
8. Depois do sexto nível, a região é concluída e a tela mostra a medalha, a pontuação acumulada e o botão de retorno ao mapa.

## Implementação técnica

O componente `NordestePhase` concentra o estado da missão:

- índice do nível atual;
- ordem das perguntas;
- posição da pergunta atual;
- estado de resolução da resposta;
- alternativa selecionada;
- feedback exibido;
- controle de reinício do cronômetro;
- conclusão do nível e da missão.

As perguntas são indexadas em um `Map` para localizar rapidamente o item correspondente ao identificador salvo em cada configuração de nível. A função `shuffle` cria cópias dos arrays antes de embaralhá-los, preservando os catálogos originais.

O avanço automático usa `setTimeout`, armazenado em `useRef`. O timeout é cancelado quando o componente é desmontado, evitando avanço depois da saída da tela.

## Pontuação e progresso

A regra de pontuação é centralizada em `src/data/scoring.ts`:

- acerto: `+100` pontos;
- erro: `0` pontos;
- tempo esgotado: `0` pontos.

O placar é atualizado pelo `ScoreContext`, por meio de `useScore().addPoints`. A conclusão da região usa `useProgress().completeRegion("nordeste")`. O `ProgressContext` persiste o progresso no `localStorage` com a chave `aventura-regioes:progress` e libera a próxima região quando aplicável.

## Feedback, sons e telemetria

Cada resultado produz uma resposta visual e sonora:

- acerto: som de sucesso e mensagem com a curiosidade;
- erro: som de erro e possibilidade de tentar novamente;
- tempo esgotado: som de timeout e avanço com a curiosidade.

Também são registrados no console eventos de telemetria para:

- resposta correta (`item_correct`);
- resposta incorreta (`item_incorrect`);
- tempo esgotado (`time_expired`);
- conclusão de nível (`level_complete`).

O registro atual é local e preparado para futura integração com um serviço de telemetria.

## Interface e responsividade

Os estilos da fase foram criados em `NordestePhase.css` e seguem as variáveis visuais globais do projeto. A interface inclui:

- cartões de resposta com imagem, ícone e texto;
- estados visuais para acerto e erro;
- animação curta de entrada para cada pergunta;
- destaque de categoria e estado relacionado;
- grade de duas colunas no desktop;
- redução da altura das imagens e do texto em telas de até 600 px;
- tela de conclusão com pontuação e retorno ao mapa.

## Como executar e validar

Na raiz do projeto:

```bash
npm install
npm run dev
```

Depois, acessar `http://localhost:5173/missao/nordeste`.

Para validar a compilação TypeScript e o build do Vite:

```bash
npm run build
```
