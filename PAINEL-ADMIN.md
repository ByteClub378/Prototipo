# Como o painel administrativo foi desenvolvido

Este documento explica a implementação do painel de métricas da Aventura das
Regiões: como a interface conversa com a API e de onde vêm as estatísticas.

## Visão geral

O painel é uma página React pública acessível em `/admin`, sem o layout de
navegação do jogo. A interface é construída em TypeScript e CSS; agregação das
métricas e acesso ao Firestore ficam no backend Node.js/Express.

```text
Navegador (/admin)
  └─ AdminPanel.tsx
       └─ cliente HTTP
            └─ API /api/v1/admin
                 ├─ rotas públicas de leitura com limite de requisições
                 ├─ serviço de estatísticas
                 └─ repositório administrativo
                      └─ Cloud Firestore
```

## 1. Entrada e tela

A rota `/admin` é declarada em `src/App.tsx` e renderiza
`src/pages/Admin/AdminPanel.tsx` diretamente, sem o `AppLayout` usado nas
demais páginas do jogo.

Ao abrir, a tela carrega as métricas sem solicitar login. A tela permite filtrar
os dados por período e por região. O período inicial é de 14 dias, incluindo
hoje.

O painel apresenta:

- cartões com jogadores cadastrados, jogadores ativos no período, tentativas,
  taxa de aprovação, precisão das respostas e duração média;
- uma tabela de tentativas, aprovação e precisão por região;
- uma lista de assuntos com acertos, erros e percentual de acerto.

Os estilos, incluindo adaptações para telas menores e foco visível, estão em
`src/pages/Admin/AdminPanel.css`.

## 2. Acesso público e somente leitura

O painel e as rotas `/api/v1/admin/stats/*` são públicos e não requerem login.
As rotas expõem apenas estatísticas agregadas, sem dados individuais dos
jogadores, e mantêm um limite de requisições. O backend continua validando os
filtros de data e região antes de consultar o Firestore.

## 3. Carregamento e filtros

Ao abrir ou alterar um filtro, o painel consulta em paralelo:

- `GET /api/v1/admin/stats/overview`
- `GET /api/v1/admin/stats/regions`
- `GET /api/v1/admin/stats/topics`

As três chamadas recebem os mesmos filtros: `from`, `to` (datas no formato
`AAAA-MM-DD`) e `regionId` opcional. O backend valida as datas, exige que o
início não seja posterior ao fim e verifica se a região pertence ao catálogo.
O fim do período é inclusivo: internamente, a consulta termina no início do
dia seguinte em UTC.

Quando um filtro muda, a interface recarrega os dados e sinaliza o estado de
atualização. A tela cancela logicamente atualizações antigas para não
substituir resultados mais recentes por respostas de uma consulta anterior.
Erros são apresentados na página.

## 4. Origem dos dados e cálculo das métricas

As tentativas concluídas são gravadas na coleção `attempts` do Firestore pelo
fluxo normal do jogo. A conclusão atualiza a tentativa e o jogador em uma
transação. Entre os dados registrados estão a região, o identificador e número
do nível, a aprovação, a pontuação, a duração, as respostas certas e erradas,
a data de conclusão e, quando enviada, a distribuição por assunto.

O cliente do jogo acumula as respostas por assunto durante a tentativa. O
backend valida que a soma dos totais por assunto corresponde aos totais da
tentativa, antes de persistir os dados.

O repositório administrativo consulta a coleção `attempts` pelo campo
`completedAt`, aplicando o período e, se informado, a região. Também consulta a
coleção `players` para obter a quantidade total de jogadores e os que já
jogaram.

O serviço calcula as estatísticas a partir dessas consultas:

- **Jogadores ativos no período:** quantidade de jogadores distintos com
  tentativa concluída no intervalo.
- **Tentativas:** tentativas concluídas dentro dos filtros.
- **Taxa de aprovação:** tentativas aprovadas divididas pelo total de tentativas.
- **Precisão:** respostas corretas divididas pelo total de respostas certas e
  erradas.
- **Duração média:** média de `durationSeconds` das tentativas encontradas.
- **Métricas por região:** os mesmos totais e percentuais, agrupados pelas cinco
  regiões do catálogo.
- **Métricas por assunto:** soma de acertos e erros de `topicResults` nas
  tentativas filtradas; o percentual é calculado sobre as respostas daquele
  assunto.

Percentuais são arredondados para números inteiros na apresentação. Quando não
há respostas para calcular um percentual, o resultado é zero; a lista de
assuntos indica que não há dados no período.

## 5. Cache e rotas adicionais

`AdminService` mantém em memória os resultados por um intervalo configurável,
com padrão de cinco minutos (`ADMIN_CACHE_TTL_SECONDS`). As consultas do resumo,
das regiões e dos assuntos com os mesmos filtros compartilham o mesmo resultado
cacheado. Se a leitura falhar, o item de cache é removido e o erro é propagado.

Além das rotas consumidas pela interface, o backend disponibiliza
`GET /api/v1/admin/stats/levels`, com estatísticas e rankings por nível.

O endpoint de níveis existe no backend, mas não é consumido pela interface
atual.

## 6. Configuração

Não é necessária configuração de credenciais para acessar o painel. O backend
usa `ADMIN_CACHE_TTL_SECONDS` para controlar o cache das estatísticas.

As configurações disponíveis e os requisitos de Firebase estão detalhados em
`backend/README.md`. O painel local pode ser iniciado junto com o backend por
`npm run dev:all`, após instalar as dependências e configurar o ambiente.

## 7. Principais arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/App.tsx` | Declara a rota `/admin`. |
| `src/pages/Admin/AdminPanel.tsx` | Carregamento, filtros e apresentação das métricas. |
| `src/pages/Admin/AdminPanel.css` | Estilos responsivos do painel. |
| `src/utils/api.ts` | Cliente HTTP, cookies, timeout e tratamento do formato de resposta da API. |
| `backend/src/routes/admin.js` | Validação dos filtros e rotas públicas de estatísticas. |
| `backend/src/services/admin.service.js` | Cache, agregações e cálculos das métricas. |
| `backend/src/repositories/admin.repository.js` | Consultas ao Firestore. |
| `backend/src/services/game.service.js` | Validação dos dados enviados ao concluir uma tentativa, inclusive resultados por assunto. |
| `backend/src/repositories/game.repository.js` | Persistência da tentativa concluída e atualização do jogador. |

## 8. Testes relacionados

Os testes do backend cobrem os serviços administrativos e o acesso público às
rotas de métricas. Para executá-los na raiz do projeto:

```bash
npm run test:backend
```
