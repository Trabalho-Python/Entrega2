# NoPrazo — frontend

Aplicação Next.js App Router com autenticação OAuth do Supabase e acesso ao banco via regras de acesso do próprio projeto.

Consulte o [README principal](../README.md) para o passo a passo completo de instalação, configuração do Supabase, execução do backend e do frontend, além de testes e troubleshooting.

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
