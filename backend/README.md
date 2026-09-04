# API — Aventura das Regiões

API pública do jogo educativo, feita em JavaScript ESM com Node.js, Express e MySQL (`mysql2`). Gerencia jogadores anônimos, sessões, tentativas, progresso, desbloqueios e medalhas.

## Execução

Na raiz, copie `.env.example` para `.env`, configure o MySQL e execute:

```bash
npm ci
npm start       # prepara o banco e inicia a API
npm run dev:all # inicia API e frontend juntos
```

API padrão: `http://localhost:3000`. Prefixo: `/api/v1`. `npm start` cria o banco, aplica migrations e seeds e inicia o servidor, sem build.

## Ambiente

| Variável | Uso | Padrão |
|---|---|---|
| `PORT` | Porta HTTP | `3000` |
| `FRONTEND_ORIGIN` | Origem permitida pelo CORS | `http://localhost:5173` |
| `COOKIE_NAME` | Cookie de sessão | `aventura_session` |
| `SESSION_TTL_HOURS` | Validade da sessão | `168` |
| `PLAYER_RETENTION_DAYS` | Retenção de inativos | `365` |
| `DB_HOST`, `DB_PORT` | Endereço do MySQL | `127.0.0.1:3306` |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credenciais e banco | — |
| `DB_CONNECTION_LIMIT` | Tamanho do pool | `10` |

## Autenticação anônima

A sessão usa token opaco em cookie `HttpOnly`, `SameSite=Lax` e, em produção, `Secure`. Apenas o hash SHA-256 é salvo. Clientes web devem usar `credentials: "include"`. O `playerId` retornado é público e não autentica requisições.

## Respostas

Sucesso: `{ "data": ... }`. Erro: `{ "error": { "code": "CODIGO", "message": "Descrição", "details": [] } }`. Respostas `204` não têm corpo.

## Endpoints

### Saúde

- `GET /health/live` — processo HTTP ativo, sem consultar o banco.
- `GET /health/ready` — confirma conexão com o MySQL.

### Sessão

- `POST /api/v1/session/bootstrap` — cria jogador/sessão (`201`) ou reutiliza a sessão válida (`200`). Retorna `playerId`, `expiresAt` e `created`.
- `POST /api/v1/session/refresh` — rotaciona o token e renova a validade.
- `DELETE /api/v1/session` — revoga a sessão e retorna `204`.

### Progresso

- `GET /api/v1/me/progress` — regiões e níveis com status `locked`, `unlocked` ou `completed`, melhor pontuação, tentativas e datas.
- `GET /api/v1/me/medals` — medalhas concedidas pelo servidor.

### Tentativas

`POST /api/v1/attempts` inicia uma tentativa idempotente:

```json
{
  "attemptId": "0f5f49b4-0742-4c3a-8f8b-1a9adf2b5ab1",
  "regionId": "norte",
  "levelNumber": 1
}
```

O cliente deve gerar um UUID e reutilizá-lo em retentativas de rede.

`PATCH /api/v1/attempts/:attemptId/complete` conclui a tentativa e atualiza pontuação, desbloqueios e medalhas em uma transação:

```json
{
  "score": 80,
  "correctAnswers": 8,
  "incorrectAnswers": 2,
  "durationSeconds": 45
}
```

### Exclusão

- `DELETE /api/v1/me/progress` com `X-Confirm-Reset: RESET` reinicia progresso, tentativas e medalhas.
- `DELETE /api/v1/me` com `X-Confirm-Delete: DELETE` exclui permanentemente jogador, sessões e dados.

## Erros principais

| HTTP | Código |
|---:|---|
| 400 | `VALIDATION_ERROR`, `SCORE_OUT_OF_RANGE`, `INVALID_ATTEMPT_ID` |
| 401 | `SESSION_INVALID` |
| 403 | `LEVEL_LOCKED` |
| 404 | `LEVEL_NOT_FOUND`, `ATTEMPT_NOT_FOUND` |
| 409 | `ATTEMPT_ID_CONFLICT`, `ATTEMPT_ALREADY_COMPLETED` |
| 429 | Limite de requisições excedido |
| 500 | `INTERNAL_ERROR` |

## Banco e manutenção

```bash
npm run db:migrate
npm run db:seed
npm run db:cleanup
```

Migrations ficam em `backend/database/migrations`; seeds, em `backend/database/seeds`. A limpeza remove sessões antigas e jogadores além da retenção configurada. O seed atual contém cinco regiões, seis níveis do Norte e a Medalha do Norte.

## Segurança

- Nenhum dado pessoal é exigido.
- Tokens não aparecem no JSON nem são persistidos em texto puro.
- SQL usa placeholders e operações de progresso usam transações.
- CORS é restrito, JSON é limitado a 32 KB e há rate limiting.
- Erros internos não expõem stack traces.
- Pontuação é validada contra o limite do nível.

As métricas finais ainda são calculadas pelo cliente. Para maior resistência a fraude, respostas ou eventos individuais deverão futuramente ser validados no servidor.

## Testes

```bash
npm run lint:backend
npm run test:backend
```

Testes transacionais completos requerem uma instância MySQL exclusiva para testes.
