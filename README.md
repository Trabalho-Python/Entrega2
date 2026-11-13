# NoPrazo

Sistema de gestão de chamados com autenticação por Supabase, regras de negócio de SLA e fluxo de atendimento por papéis.

Este projeto é composto por duas partes:

- `help_desk/`: API FastAPI responsável pelo cálculo e validação do SLA.
- `no-prazo/`: aplicação Next.js que oferece a interface do sistema, autenticação e acesso ao banco via Supabase.

## Visão geral da arquitetura

- O frontend usa Next.js App Router e autenticação OAuth do Supabase.
- O banco principal fica no Supabase/PostgreSQL.
- A API de SLA é um serviço interno em Python/FastAPI.
- O frontend chama a API de SLA apenas no servidor, nunca diretamente no navegador.
- A autenticação depende dos metadados do usuário (`app_metadata.role`) com `solicitante` ou `resolvedor`.

## Requisitos para executar

Antes de começar, confirme que você possui:

- Git
- Node.js 20+ e npm
- Python 3.11+ (compatível com o ambiente do projeto)
- Um projeto Supabase configurado
- Acesso ao SQL Editor do Supabase
- Um provedor OAuth habilitado, como Google

## Estrutura do repositório

- `help_desk/` — backend Python/FastAPI
- `help_desk/.env.example` — exemplo de variáveis do backend
- `no-prazo/` — frontend Next.js
- `no-prazo/.env.local.example` — exemplo de variáveis do frontend
- `no-prazo/supabase/migrations/20261113000000_initial.sql` — schema inicial do banco

## 1) Preparar o Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor do projeto.
3. Aplique a migration:
   - `no-prazo/supabase/migrations/20261113000000_initial.sql`
4. Confirme que as tabelas e policies foram criadas corretamente.
5. Ative o provedor OAuth que você vai usar, por exemplo Google.
6. Configure a URL de callback do login:
   - `http://localhost:3000/NoPrazo/auth/callback`
7. Cadastre categorias na tabela `public.categorias` antes de abrir chamados.
8. Defina o papel de cada usuário em `app_metadata.role`:
   - `solicitante`
   - `resolvedor`

> Importante: o papel não deve ser confiável a partir de dados editáveis pelo usuário. Ele deve ser atribuído por um administrador ou via fluxo seguro do Supabase.

## 2) Configurar o backend Python

Abra o terminal na pasta do projeto e execute:

```bash
cd help_desk
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
```

Agora edite o arquivo `help_desk/.env` com os valores reais do seu ambiente. O exemplo esperado é:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
SLA_API_KEY=replace-with-a-long-random-secret
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=2
DB_POOL_TIMEOUT=10
DB_POOL_RECYCLE=1800
DB_CONNECT_TIMEOUT=10
```

### Observações importantes

- `DATABASE_URL` deve ser a conexão PostgreSQL do Supabase, não a URL pública HTTPS.
- Use a string de conexão do banco com `sslmode=require`.
- `SLA_API_KEY` deve ser igual ao valor configurado no frontend.

## 3) Iniciar o backend

Ainda dentro da pasta `help_desk` com o ambiente virtual ativado:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Se tudo estiver correto, o backend ficará disponível em:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/readyz`

O endpoint `/readyz` valida a conexão com o banco.

## 4) Configurar o frontend Next.js

Abra outro terminal e execute:

```bash
cd no-prazo
cp .env.local.example .env.local
```

Edite o arquivo `no-prazo/.env.local` com os dados reais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
NEXT_PUBLIC_BASE_PATH=/NoPrazo
SUPABASE_AUTH_PROVIDER=google
API_INTERNAL_URL=http://127.0.0.1:8000
SLA_API_KEY=replace-with-a-long-random-secret
```

### Valores esperados

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública do projeto
- `NEXT_PUBLIC_BASE_PATH`: `/NoPrazo` e deve coincidir com o `basePath` do `next.config.ts`
- `API_INTERNAL_URL`: URL do backend em execução local
- `SLA_API_KEY`: mesmo valor usado no backend

## 5) Instalar dependências do frontend

No diretório `no-prazo`:

```bash
npm install
```

Se você preferir uma instalação limpa com lockfile:

```bash
npm ci
```

## 6) Iniciar o frontend

```bash
npm run dev
```

A aplicação estará disponível em:

- `http://localhost:3000/NoPrazo`

A primeira vez que abrir o sistema, o fluxo de autenticação redirecionará para o provedor OAuth configurado.

## 7) Fluxo completo de uso

1. Acesse a URL local do frontend.
2. Faça login com o provedor OAuth configurado.
3. O usuário entra com o papel atribuído no Supabase.
4. O solicitante cria um chamado.
5. O resolvedor visualiza os chamados e acompanha o SLA.
6. O backend de SLA calcula e valida prazos automaticamente.

## 8) Rodar em produção local (opcional)

Para gerar o build de produção:

```bash
cd no-prazo
npm run build
npm run start
```

Isso inicia a aplicação em modo de produção usando o mesmo `basePath` `/NoPrazo`.

## 9) Testes e validações

### Backend

```bash
cd help_desk
source .venv/bin/activate
pytest -q
```

### Frontend

```bash
cd no-prazo
npm run lint
npm test
npx tsc --noEmit
npm run build
```

## 10) Troubleshooting

### Erro de conexão com o banco

- Verifique se a `DATABASE_URL` é a string de conexão correta do Supabase.
- Confirme se o projeto foi criado e a migration aplicada.
- Verifique o bloco `sslmode=require` na URL do banco.

### Login não funciona

- Confirme a URL de callback:
  - `http://localhost:3000/NoPrazo/auth/callback`
- Verifique se o provedor OAuth está habilitado no Supabase.
- Confira se o usuário tem `app_metadata.role` preenchido.

### Problemas de SLA

- Verifique se `SLA_API_KEY` é igual nos dois ambientes.
- Teste o backend em `http://127.0.0.1:8000/health` e `/readyz`.
- Confirme se `API_INTERNAL_URL` aponta para o backend correto.

### Porta 3000 ocupada

- Feche qualquer outro processo usando a porta `3000`.
- Ou rode o frontend em uma porta diferente com uma configuração específica do Next.

## Resumo de execução rápida

```bash
cd help_desk
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Em outro terminal:

```bash
cd no-prazo
cp .env.local.example .env.local
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000/NoPrazo
```

## Observações finais

- A API de SLA não é um CRUD público; ela existe para cálculo e validação de prazos.
- O frontend e o backend precisam compartilhar o mesmo segredo `SLA_API_KEY`.
- A configuração correta do Supabase é essencial para autenticação, banco e regras de acesso.
- O projeto foi desenhado para operar com base de dados Supabase e autenticação OAuth real.
