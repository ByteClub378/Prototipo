# API — Aventura das Regiões

API pública do jogo educativo, feita em JavaScript ESM com Node.js, Express e Cloud Firestore pelo Firebase Admin SDK. Gerencia jogadores anônimos, sessões, tentativas, progresso, desbloqueios e medalhas.

## Execução

Na raiz, copie `.env.example` para `.env`, crie um projeto Firebase com Cloud Firestore e configure uma conta de serviço. Em produção no Google Cloud, Application Default Credentials também podem ser usadas.

```bash
npm ci
npm start       # carrega o catálogo no Firestore e inicia a API
npm run dev:all # inicia API e frontend juntos
```

API padrão: `http://localhost:3000`. Prefixo: `/api/v1`. `npm start` valida o Firebase, executa o seed idempotente e inicia o servidor, sem build.

## Ambiente

| Variável | Uso | Padrão |
|---|---|---|
| `PORT` | Porta HTTP | `3000` |
| `NODE_ENV` | `development`, `test` ou `production` | `development` |
| `TRUST_PROXY` | Confiar no proxy reverso (usar `true` no Render) | `false` |
| `FRONTEND_ORIGIN` | Única origem permitida pelo CORS e pela validação de origem | `http://localhost:5173` |
| `COOKIE_NAME` | Cookie de sessão | `aventura_session` |
| `SESSION_TTL_HOURS` | Validade da sessão | `168` |
| `SESSION_SECRET` | Segredo de assinatura, mínimo 32 caracteres | obrigatório em produção |
| `PLAYER_RETENTION_DAYS` | Retenção de inativos | `365` |
| `ADMIN_CACHE_TTL_SECONDS` | Cache das estatísticas, entre 30 e 3600 segundos | `300` |
| `PUBLIC_STATS_MIN_SAMPLE_SIZE` | Amostra mínima para exibir recortes públicos | `5` |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase | obrigatório |
| `FIREBASE_CLIENT_EMAIL` | E-mail da conta de serviço | opcional com ADC |
| `FIREBASE_PRIVATE_KEY` | Chave privada com `\n` escapado | opcional com ADC |
| `FIRESTORE_EMULATOR_HOST` | Host do emulador local | opcional |

## Autenticação anônima

A sessão usa um cookie assinado `HttpOnly`. Em desenvolvimento HTTP local ele é
`SameSite=Lax`; em produção ou quando `FRONTEND_ORIGIN` usa HTTPS, ele é
`SameSite=None; Secure`, necessário quando site e API estão em domínios
diferentes. A assinatura é validada localmente pela API, sem leitura do Firestore
em cada requisição. Clientes web devem usar `credentials: "include"`. O
`playerId` retornado é público e não autentica requisições.

Por ser stateless, o logout remove o cookie do navegador, mas não mantém uma
lista de revogação no Firestore. Um cookie eventualmente copiado permanece
válido até expirar; trocar `SESSION_SECRET` invalida todos os cookies existentes.
Essa é a troca consciente para eliminar leituras de sessão por requisição.

## Respostas

Sucesso: `{ "data": ... }`. Erro: `{ "error": { "code": "CODIGO", "message": "Descrição", "details": [] } }`. Respostas `204` não têm corpo.

## Endpoints

### Saúde

- `GET /health/live` — processo HTTP ativo, sem consultar o banco.
- `GET /health/ready` — confirma acesso ao Cloud Firestore.

### Sessão

- `POST /api/v1/session/bootstrap` — cria jogador (`201`, uma gravação) ou reutiliza o cookie válido (`200`, sem operação no Firestore). Retorna `playerId`, `expiresAt` e `created`. O corpo opcional `{ "forceNew": true }` cria uma sessão de jogador nova mesmo quando há um cookie válido.
- `POST /api/v1/session/refresh` — renova o cookie assinado sem acessar o Firestore.
- `DELETE /api/v1/session` — remove o cookie neste navegador e retorna `204`.

### Progresso

- `GET /api/v1/me/state` — endpoint preferido: retorna `playerId`, `revision`, progresso e medalhas com apenas uma leitura.
- `GET /api/v1/me/progress` e `GET /api/v1/me/medals` — compatibilidade; evitá-los em conjunto, pois cada chamada faz uma leitura.

O objeto `progress` inclui `bonus: { status, unlockedAt }`. O status muda de
`locked` para `unlocked` quando as cinco regiões estiverem concluídas.

### Tentativas

`POST /api/v1/attempts` valida o início de uma tentativa, mas não grava nada no
Firestore. É opcional; o cliente pode gerar o UUID e enviar somente a conclusão:

```json
{
  "attemptId": "0f5f49b4-0742-4c3a-8f8b-1a9adf2b5ab1",
  "regionId": "norte",
  "levelNumber": 1
}
```

O cliente deve gerar um UUID e reutilizá-lo em retentativas de rede. A resposta
possui `persisted: false`.

`PATCH /api/v1/attempts/:attemptId/complete` conclui a tentativa e atualiza pontuação, desbloqueios e medalhas em uma transação:

```json
{
  "regionId": "norte",
  "levelNumber": 1,
  "score": 80,
  "correctAnswers": 8,
  "incorrectAnswers": 2,
  "durationSeconds": 45
}
```

Opcionalmente, o frontend pode enviar `topicResults` com totais agregados por
assunto. A soma deve corresponder aos acertos e erros da tentativa:

```json
{
  "topicResults": [
    { "topicId": "fauna", "correctAnswers": 3, "incorrectAnswers": 1 },
    { "topicId": "biomas", "correctAnswers": 2, "incorrectAnswers": 0 }
  ]
}
```

Assuntos aceitos: `fauna`, `flora`, `biomas`, `clima`, `estados-capitais`,
`cultura`, `culinaria`, `festas-populares`, `historia` e `turismo`.

A conclusão é o único ponto de persistência da partida: cria uma tentativa e
atualiza o documento do jogador na mesma transação. A nota mínima é 60% de
`maxScore`. Uma reprovação registra a tentativa e a melhor pontuação, mas não
conclui a fase nem desbloqueia a seguinte. A resposta, inclusive em repetição
idempotente, contém `passed`, `minScore`, `maxScore`, `revision` e
`awardedMedals`. O frontend deve substituir seu cache quando a revisão aumentar.

```json
{
  "data": {
    "attemptId": "0f5f49b4-0742-4c3a-8f8b-1a9adf2b5ab1",
    "status": "completed",
    "score": 320,
    "passed": true,
    "minScore": 240,
    "maxScore": 400,
    "revision": 2,
    "idempotent": false,
    "awardedMedals": []
  }
}
```

### Estratégia de baixo consumo

- Autenticação e renovação de cookie: zero leituras e gravações.
- Estado completo: uma leitura do documento do jogador.
- Início opcional: zero leituras e gravações.
- Conclusão: duas leituras transacionais e duas gravações.
- `lastSeenAt` muda somente em criação, conclusão e reinicialização.
- Não são persistidos cliques, respostas individuais ou pulsos do cronômetro.
- A primeira conclusão também marca `hasPlayed`, `firstPlayedAt` e incrementa
  `completedAttemptCount` na mesma escrita já feita no documento do jogador.

### Estatísticas públicas

As rotas são públicas e estritamente de leitura. Não exigem login, cookie de
jogador nem chave de API. O rate limit e o cache permanecem ativos para proteger
a API e reduzir consultas ao Firestore.

Para proteger grupos pequenos, fases, regiões, dias e assuntos abaixo de
`PUBLIC_STATS_MIN_SAMPLE_SIZE` são omitidos. As respostas informam
`minimumSampleSize` e contadores `suppressed*`. Evolução e distribuição retornam
`suppressed: true` quando não atingem a amostra mínima.

- `GET /api/v1/admin/stats/overview` — total de jogadores, jogadores que
  concluíram ao menos uma tentativa, tentativas, aprovação, precisão e duração.
- `GET /api/v1/admin/stats/levels` — métricas por fase e rankings das fases mais
  jogadas e com melhor desempenho.
- `GET /api/v1/admin/stats/regions` — métricas e rankings consolidados por região.
- `GET /api/v1/admin/stats/trends` — série diária para gráficos, limitada a 31 dias.
- `GET /api/v1/admin/stats/topics` — desempenho por matéria ou assunto.
- `GET /api/v1/admin/stats/difficulties` — ranking de dificuldade por fase.
- `GET /api/v1/admin/stats/learning-evolution` — comparação entre primeiras
  tentativas e repetições.
- `GET /api/v1/admin/stats/score-distribution` — faixas de pontuação normalizada.
- `GET /api/v1/admin/stats/engagement` — atividade, repetição e conclusão regional.

Todos aceitam `from=YYYY-MM-DD`, `to=YYYY-MM-DD` e `regionId`. Sem datas, os
endpoints gerais consideram todo o histórico. O período máximo é 366 dias. Em
`trends`, o padrão é 14 dias e o máximo é 31 dias.

O índice de desempenho é `70% × accuracyRate + 30% × passRate`. O índice de
dificuldade combina 50% de reprovação, 35% de erros e 15% de duração relativa.
A evolução compara grupos de primeiras tentativas e repetições, não indivíduos.
`learning-evolution`, `score-distribution` e `topics` consideram somente
tentativas que possuam os novos campos analíticos; dados antigos continuam nos
totais gerais, mas não são inferidos artificialmente nessas métricas.

Exemplo resumido de `overview`:

```json
{
  "data": {
    "generatedAt": "2026-09-29T17:00:00.000Z",
    "cacheTtlSeconds": 300,
    "players": { "total": 120, "whoPlayed": 95, "whoOnlyOpened": 25 },
    "attempts": {
      "total": 430,
      "passed": 310,
      "failed": 120,
      "passRate": 72.09,
      "accuracyRate": 76.4,
      "averageDurationSeconds": 48.2,
      "totalCorrectAnswers": 1528,
      "totalIncorrectAnswers": 472
    }
  }
}
```

As consultas usam agregações do Firestore e cache em memória para economizar
leituras. O cache é individual por processo e reinicia em cada deploy. Métricas
por fase sem tentativas retornam zero e não aparecem nos rankings.

`players.whoPlayed` depende dos campos adicionados ao jogador quando uma
tentativa é concluída. Jogadores antigos que não concluírem outra tentativa após
esta versão não são retroativamente marcados. Já as métricas baseadas em
`attempts` consideram os documentos existentes no momento da consulta.

Apesar do prefixo histórico `/admin/stats`, esses endpoints não concedem
privilégios administrativos e não executam alterações no banco.

### Exclusão

- `DELETE /api/v1/me/progress` com `X-Confirm-Reset: RESET` reinicia progresso, tentativas e medalhas.
- `DELETE /api/v1/me` com `X-Confirm-Delete: DELETE` exclui permanentemente jogador, sessões e dados.

## Erros principais

| HTTP | Código |
|---:|---|
| 400 | `VALIDATION_ERROR`, `SCORE_OUT_OF_RANGE`, `INVALID_ATTEMPT_ID` |
| 401 | `SESSION_INVALID` |
| 403 | `LEVEL_LOCKED` |
| 403 | `ORIGIN_NOT_ALLOWED` |
| 404 | `LEVEL_NOT_FOUND` |
| 409 | `ATTEMPT_ID_CONFLICT`, `ATTEMPT_ALREADY_COMPLETED` |
| 429 | Limite de requisições excedido |
| 500 | `INTERNAL_ERROR` |

## Firestore e manutenção

```bash
npm run firebase:seed
npm run db:cleanup
```

O seed cria ou atualiza `regions`, `levels`, `medals` e `topics`. A aplicação usa `players`
e `attempts`; sessões assinadas não geram documentos. Por ser um banco sem
esquema, não existem migrations SQL. A limpeza remove jogadores inativos e suas
tentativas. O catálogo atual contém cinco regiões, três níveis do Norte, três
níveis do Nordeste, uma fase do Centro-Oeste, uma do Sudeste, três do Sul e as
respectivas medalhas. A API também retorna `progress.bonus`: ela fica `unlocked`
quando as cinco regiões estiverem concluídas. A fase bônus ainda não aceita
tentativas porque o frontend não definiu perguntas, pontuação ou regra de aprovação.
Documentos de
jogadores criados antes da ampliação do catálogo são normalizados pela API sem
uma migração separada.

As regras em `backend/firebase/firestore.rules` negam todo acesso direto de
clientes. Elas devem ser publicadas no projeto Firebase; o Admin SDK do backend
continua autorizado pela conta de serviço. As consultas administrativas usam os
índices compostos versionados em `backend/firebase/firestore.indexes.json`.

Com o Firebase CLI autenticado, publique regras e índices a partir da raiz:

```bash
firebase deploy --only firestore --config backend/firebase/firebase.json
```

## Segurança

- Nenhum dado pessoal é exigido.
- Cookies assinados não aparecem no JSON e não são persistidos no Firestore.
- Escritas críticas de tentativa e progresso usam transações do Firestore.
- CORS é restrito, JSON é limitado a 32 KB e há rate limiting.
- Rotas da API rejeitam explicitamente um cabeçalho `Origin` diferente de
  `FRONTEND_ORIGIN`; CORS sozinho não é usado como proteção contra requisições.
- Erros internos não expõem stack traces.
- Pontuação é validada contra o limite do nível.

As métricas finais ainda são calculadas pelo cliente. Para maior resistência a fraude, respostas ou eventos individuais deverão futuramente ser validados no servidor.

## Testes

```bash
npm run lint:backend
npm run test:backend
```

Testes transacionais completos requerem o Firebase Emulator Suite ou um projeto Firebase exclusivo para testes.

## Configuração no Render

Para a arquitetura com Static Site e Web Service separados:

```env
NODE_ENV=production
FRONTEND_ORIGIN=https://braziladventure.onrender.com
TRUST_PROXY=true
```

Os valores não devem ter aspas, espaços finais ou barra final. Após o deploy, o
bootstrap deve responder com `Set-Cookie` contendo `HttpOnly; Secure;
SameSite=None`. A alternativa mais resistente a bloqueio de cookies de terceiros
é publicar frontend e API sob a mesma origem; servir o frontend pelo Express não
foi implementado porque pertence à decisão de hospedagem e ao escopo do frontend.

### Auditoria de dependências

O Firebase Admin 14.4.0, versão mais recente no momento desta atualização,
carrega pelo módulo interno de Storage uma versão de `uuid` sinalizada com
severidade moderada. Este backend utiliza apenas Firestore e não chama as APIs
afetadas de UUID v3/v5/v6. A dependência deve ser reavaliada quando o Firebase
Admin publicar uma atualização compatível.
