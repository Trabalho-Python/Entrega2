# NoPrazo

Sistema de abertura e acompanhamento de chamados de suporte, com controle de SLA e histórico.

Este README descreve as decisões atuais de implementação. A documentação acadêmica DOCX em `Documentacoes/` antecede a separação de papéis e as policies RLS; não use os trechos antigos que tratam permissões como fora de escopo para configurar o sistema atual.

## Arquitetura

- `no-prazo/`: Next.js App Router. Supabase Auth para OAuth; o Next acessa o Postgres diretamente para CRUD.
- `no-prazo/supabase/migrations/`: schema versionado, constraints, histórico, pausa de SLA e policies RLS.
- `help_desk/`: FastAPI + SQLAlchemy isolado para cálculo de SLA. O endpoint interno exige `X-SLA-API-Key`; não oferece CRUD de chamados.
- Solicitantes usam `/NoPrazo/chamados/novo` e `/NoPrazo/meus-chamados`; resolvedores usam `/NoPrazo/home` e `/NoPrazo/prazos`.

Não há formulário próprio de senha: `/auth/login` inicia o provedor OAuth configurado no Supabase. O papel confiável fica em `app_metadata.role` (`solicitante` ou `resolvedor`) e deve ser atribuído por um administrador, nunca por metadados editáveis pelo próprio usuário.

## Premissas de negócio adotadas

- O SLA é de horas corridas: 6h para alta, 12h para média e 24h para baixa.
- O relógio pausa somente no estado `aguardando` e retoma quando o resolvedor volta para `em_andamento`.
- O fluxo permitido é `aberto → em_andamento → aguardando/resolvido → em_andamento/resolvido → fechado`, com a trigger impedindo saltos inválidos.
- OAuth Google é o provedor padrão por não haver tela customizada de login; outro provedor pode ser definido em `SUPABASE_AUTH_PROVIDER` e habilitado no Dashboard.

## Configurar Supabase

1. Configure um projeto Supabase e aplique `no-prazo/supabase/migrations/20261113000000_initial.sql` pelo SQL Editor ou por Supabase CLI.
2. Habilite o provedor OAuth definido em `SUPABASE_AUTH_PROVIDER` (padrão Google) e cadastre a URL de callback `http://localhost:3000/NoPrazo/auth/callback`. Para produção, cadastre a URL HTTPS equivalente.
3. Atribua `app_metadata.role` a cada usuário usando a Supabase Admin API em ambiente administrativo confiável: `solicitante` ou `resolvedor`. Nunca exponha a chave `service_role` no Next/browser.
4. Cadastre categorias em `public.categorias` antes de abrir chamados.

A migration cria automaticamente o perfil em `public.usuarios` no cadastro Auth. O banco ativo não foi acessível durante esta implementação; aplique a migration em uma cópia/ambiente de teste e compare o schema existente antes de produção.

## Variáveis de ambiente

Copie `help_desk/.env.example` para `help_desk/.env` e `no-prazo/.env.local.example` para `no-prazo/.env.local`. Preencha os valores localmente; os exemplos não contêm credenciais reais.

**Frontend (`no-prazo/.env.local`)**

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anon/publishable; nunca use `service_role`.
- `NEXT_PUBLIC_BASE_PATH`: `/NoPrazo`, igual ao `basePath` em `next.config.ts`.
- `SUPABASE_AUTH_PROVIDER`: provedor OAuth habilitado no projeto (padrão `google`).
- `API_INTERNAL_URL`: URL privada do FastAPI, padrão `http://127.0.0.1:8000`.
- `SLA_API_KEY`: segredo server-to-server, idêntico ao valor no ambiente do FastAPI. Gere um segredo aleatório e não o envie ao navegador.

**Backend (`help_desk/.env`)**

- `DATABASE_URL`: conexão PostgreSQL do Supabase, com SSL conforme as instruções do projeto (normalmente `sslmode=require`).
- `SLA_API_KEY`: o mesmo segredo privado configurado no Next.
- `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, `DB_POOL_RECYCLE`, `DB_CONNECT_TIMEOUT`: limites do pool PostgreSQL.

O FastAPI não aceita operações CRUD; somente a chamada server-side de cálculo SLA usa `SLA_API_KEY`. `/health` não consulta o banco; `/readyz` testa a conexão PostgreSQL.

## Executar localmente

1. Configure as variáveis e aplique a migration.
2. Inicie o FastAPI, a partir de `help_desk/`:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements-dev.txt
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

3. Em outro terminal, inicie o Next:

   ```bash
   cd no-prazo
   npm ci
   npm run dev
   ```

4. Acesse `http://localhost:3000/NoPrazo`. O primeiro acesso redireciona ao provedor OAuth; após autenticar, a aplicação envia cada papel à sua área.

Se aparecer erro de conexão PostgreSQL, confira `/readyz` e `DATABASE_URL`. `localhost:5432` só funciona quando um PostgreSQL local está rodando; para a arquitetura do projeto, configure o endpoint Postgres do Supabase. Se a porta 3000 estiver ocupada, encerre o servidor Next anterior antes de iniciar outro.

## Verificações

Frontend, em `no-prazo/`:

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

Backend, em `help_desk/` com o ambiente virtual ativo:

```bash
pip install -r requirements-dev.txt
pytest -q
```

Os testes unitários de SLA cobrem prioridades, UTC, virada de dia, pausas e autenticação por chave. A validação ponta a ponta e as policies RLS ainda exigem um projeto Supabase de teste configurado.

O arquivo `no-prazo/supabase/tests/rls.test.sql` verifica que RLS e as policies esperadas estão instaladas; execute-o em uma base Supabase de teste com pgTAP disponível após aplicar a migration. Não foi possível executar esse teste nem validar OAuth/RLS de ponta a ponta sem credenciais e banco Supabase acessíveis.
