# NoPrazo

Sistema de gestão de chamados com SLA, filas de atendimento e papéis de solicitante/resolvedor.

## Execução local em um comando

Pré-requisitos: Docker, Node.js 20+, Python 3.11+ e Git.

```bash
cd /caminho/para/NoPrazo
chmod +x scripts/start-local-dev.sh
./scripts/start-local-dev.sh
```

Esse comando faz tudo automaticamente:

- inicia o Supabase local via CLI
- aplica a migration do banco
- cria categorias e usuários de teste
- gera `help_desk/.env` e `no-prazo/.env.local`
- cria um `SLA_API_KEY` aleatório
- inicia o backend e o frontend locais

## Dados de teste

Use o modo de desenvolvimento para entrar sem OAuth do Google:

- solicitante: `solicitante@noprazo.local` / `solicitante123`
- resolvedor: `resolvedor@noprazo.local` / `resolvedor123`

## URLs locais
Tem comentar come solicitante solicitante valendo prazo poca solicita inbaixo dremado atribuition fiz toda interface e depois comecei a fazer o chamado semado financeiro prioridade alta en 6 horas seu chamado vai ser resolvido titul financeiro, mayor saldia fora salvo chamado chama demorando tanto demorando salve chamado seria então ela pega conversar com quem abriu chamado montar interface depois
- Frontend: `http://localhost:3000/NoPrazo`
- Backend: `http://127.0.0.1:8000/health`
- Supabase local: `http://127.0.0.1:54323` (Studio)

## Estrutura principal

- `help_desk/`: API FastAPI do SLA
- `no-prazo/`: aplicação Next.js
- `no-prazo/supabase/migrations/`: schema do banco
- `no-prazo/supabase/seed.sql`: categorias e usuários de teste

## Desenvolvimento manual

Se quiser rodar sem o script:

```bash
cd no-prazo
npx supabase@latest start
npx supabase@latest db reset --yes

cd ../help_desk
source ../.venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

cd ../no-prazo
npm install
npm run dev
```

## Validação rápida

```bash
cd no-prazo
npm run lint
npx tsc --noEmit
```
