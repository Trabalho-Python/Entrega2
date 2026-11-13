# NoPrazo — frontend

Aplicação Next.js App Router. Autenticação OAuth pelo Supabase Auth; CRUD direto no Postgres com RLS. A API FastAPI interna é chamada somente pelo servidor Next para calcular SLA.

Consulte o [README principal](../README.md) para setup do Supabase, variáveis de ambiente, papéis, migrations, execução e testes.

## Comandos

```bash
npm ci
npm run dev
npm run lint
npm test
npx tsc --noEmit
npm run build
```
