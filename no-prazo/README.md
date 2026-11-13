# NoPrazo — frontend

Aplicação Next.js App Router com autenticação local por Supabase e fluxo de desenvolvimento pronto para uso.

## Rodar localmente

No diretório raiz do projeto:

```bash
chmod +x scripts/start-local-dev.sh
./scripts/start-local-dev.sh
```

Isso inicia:

- Supabase local
- migration do banco
- seed de categorias e usuários de teste
- backend FastAPI
- frontend Next.js

## Login de desenvolvimento

- Solicitante: `solicitante@noprazo.local` / `solicitante123`
- Resolvedor: `resolvedor@noprazo.local` / `resolvedor123`

## Acesso

- Frontend: `http://localhost:3000/NoPrazo`
- Backend: `http://127.0.0.1:8000/health`

Consulte o [README principal](../README.md) para a visão geral completa do projeto.

## Execução rápida

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000/NoPrazo
```

## Verificações úteis

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```
