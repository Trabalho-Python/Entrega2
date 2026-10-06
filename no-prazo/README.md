# NoPrazo — frontend

Frontend Next.js para o serviço FastAPI localizado em `../help_desk`.

## Executar localmente

Pré-requisitos: Node.js compatível com Next.js 16 e um backend FastAPI ativo ligado ao banco PostgreSQL do projeto.

1. Inicie o backend em outro terminal, a partir de `../help_desk`:

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edite .env e informe DATABASE_URL e CORS_ORIGINS.
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. No diretório deste frontend, configure e inicie o Next.js:

   ```bash
   cp .env.local.example .env.local
   npm install
   npm run dev
   ```

3. Abra `http://localhost:3000/NoPrazo`. A documentação interativa da API fica em `http://127.0.0.1:8000/docs`.

O frontend consulta `/chamados`, `/chamados/resumo`, `/categorias`, `/usuarios` e `/health`; cria chamados com `POST /chamados`. No navegador, `/NoPrazo/api/help-desk/*` é encaminhado pelo Next ao backend. Server Components usam `API_INTERNAL_URL`, sem expor essa URL no bundle público.

## Configuração

- `API_INTERNAL_URL`: URL privada do backend usada pelo servidor Next; por padrão, `http://127.0.0.1:8000`.
- `NEXT_PUBLIC_API_BASE_URL`: URL usada pelo navegador; o exemplo aponta para o proxy local `/NoPrazo/api/help-desk`.
- `DATABASE_URL`: conexão PostgreSQL configurada no `.env` do backend.
- `CORS_ORIGINS`: origens permitidas pelo FastAPI, separadas por vírgula. O proxy local evita CORS no fluxo normal do navegador; mantenha esta lista restrita se o backend também for acessado diretamente.

O backend não cria o schema nem usuários/categorias automaticamente. O banco precisa conter as tabelas esperadas pelos modelos e pelo menos um usuário e uma categoria para criar chamados. O modelo de usuário referencia `auth.users`; a configuração/migrações e os dados dessa base devem existir antes do teste ponta a ponta.

## Verificações

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Com o backend e o banco disponíveis, confira `GET /health`, carregue o painel e abra um chamado em `/NoPrazo/chamados/novo`. A resposta da criação deve ser HTTP 201 e o chamado deve aparecer na fila aberta.
