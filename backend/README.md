# Backend — Aventura das Regiões

API isolada do frontend, construída em JavaScript com Node.js, Express e MySQL (`mysql2`).

## Preparação

1. Na raiz do projeto, copie `backend/.env.example` para `.env` e configure o MySQL.
2. Garanta que o usuário MySQL informado tenha permissão para criar o banco na
   primeira execução (ou crie o banco previamente).
3. Para configurar banco, aplicar migrations, executar seeds e iniciar a API em
   um único comando, execute na raiz:

```bash
npm ci
npm start
```

`npm start` não executa build. Como o backend é JavaScript puro, os arquivos são
executados diretamente pelo Node.js.

Para preparar/iniciar o backend e ligar o frontend simultaneamente, use:

```bash
npm run dev:all
```

Pressione `Ctrl+C` para encerrar os dois processos.

Execute `npm run db:cleanup` periodicamente (por exemplo, uma vez ao dia). O
comando remove sessões antigas e jogadores inativos após `PLAYER_RETENTION_DAYS`.

Validação local:

```bash
npm run lint:backend
npm run test:backend
npm run build:backend
```

A API usa o prefixo `/api/v1`. O cookie de sessão é opaco, `HttpOnly` e `SameSite=Lax`; em produção também é `Secure`.
