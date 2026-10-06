# NoPrazo

Sistema de chamados e acompanhamento de SLA, composto por um frontend Next.js e uma API FastAPI.

## Estrutura

- `no-prazo/`: aplicação web Next.js.
- `help_desk/`: API FastAPI, modelos SQLAlchemy e conexão com PostgreSQL.
- `Documentacoes/`: documentação e instruções adicionais do projeto.

## Pré-requisitos

- Node.js e npm compatíveis com Next.js 16.
- Python 3 e pip.
- Banco PostgreSQL acessível pelo backend. A aplicação não cria automaticamente o banco nem popula os dados iniciais.

## 1. Configurar o banco de dados

O backend precisa de uma URL de conexão PostgreSQL. As tabelas e os registros necessários devem existir antes de iniciar o fluxo de chamados. O modelo de usuário referencia `auth.users`; se estiver usando Supabase, configure o projeto e os usuários/categorias de acordo com o schema usado pela aplicação.

## 2. Configurar e iniciar o backend

Abra um terminal na raiz do projeto e execute:

```bash
cd help_desk
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edite `help_desk/.env` e informe os dados reais da conexão. Exemplo de formato:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Não compartilhe nem versione o arquivo `.env`. Com a configuração pronta, inicie a API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

O backend adapta essa URL para o driver `psycopg2` listado em `requirements.txt`.

Confira se o backend está ativo abrindo `http://127.0.0.1:8000/health` — a resposta esperada é `{"status":"ok"}`. A documentação interativa dos endpoints fica em `http://127.0.0.1:8000/docs`.

## 3. Configurar e iniciar o frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd no-prazo
cp .env.local.example .env.local
npm install
npm run dev
```

O exemplo define `API_INTERNAL_URL=http://127.0.0.1:8000` para chamadas do servidor Next e `NEXT_PUBLIC_API_BASE_URL=/NoPrazo/api/help-desk` para o navegador. O Next encaminha as chamadas do navegador ao backend pelo proxy configurado; assim, o fluxo local não depende de chamadas cross-origin diretas.

Abra **http://localhost:3000/NoPrazo**.

## Fluxo principal para testar

1. Confirme que o endpoint `/health` do backend responde com status `ok`.
2. Abra o painel em `http://localhost:3000/NoPrazo`.
3. Acesse **Novo chamado**.
4. Selecione um solicitante e uma categoria cadastrados no banco.
5. Preencha título, descrição e prioridade; envie o formulário.
6. A criação deve retornar HTTP 201 e o chamado deve aparecer na fila de chamados abertos.

A API oferece `GET /health`, `GET /chamados`, `GET /chamados/resumo`, `GET /categorias`, `GET /usuarios` e `POST /chamados`. Consulte `/docs` para detalhes dos contratos.

## Verificações do frontend

Execute a partir de `no-prazo/`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Solução de problemas

- **Erro de conexão ou dados vazios:** confirme que o backend está ativo, que `API_INTERNAL_URL` aponta para ele e que o `.env` do backend contém a `DATABASE_URL` correta.
- **Erro ao carregar solicitantes/categorias:** confira se as tabelas esperadas existem e contêm registros.
- **Erro ao criar chamado (404):** o solicitante ou a categoria selecionada pode não existir no banco.
- **Problemas de CORS ao acessar a API diretamente:** inclua a origem do frontend em `CORS_ORIGINS`. No uso normal descrito acima, o frontend passa pelo proxy do Next.
- **Mudou o `basePath` ou a porta do backend:** atualize `NEXT_PUBLIC_API_BASE_URL`/`API_INTERNAL_URL` e a configuração do proxy no `no-prazo/next.config.ts`; reinicie o servidor Next após mudar as variáveis.
