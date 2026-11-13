#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/no-prazo"
BACKEND_DIR="$ROOT_DIR/help_desk"
VENV_DIR="$ROOT_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "Criando ambiente virtual do Python em $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r "$BACKEND_DIR/requirements-dev.txt"

cd "$FRONTEND_DIR"
npm install --silent

SUPABASE_STATUS="$(npx --yes supabase@latest status -o env 2>/dev/null || true)"
if ! printf '%s\n' "$SUPABASE_STATUS" | grep -q '^API_URL='; then
  npx --yes supabase@latest start > /tmp/noprazo-supabase.log 2>&1 || {
    echo "Falha ao iniciar o Supabase local. Veja o log em /tmp/noprazo-supabase.log"
    cat /tmp/noprazo-supabase.log
    exit 1
  }
fi

npx --yes supabase@latest migration up > /tmp/noprazo-supabase-migration.log 2>&1 || {
  echo "Falha ao aplicar as migrations pendentes do Supabase local."
  cat /tmp/noprazo-supabase-migration.log
  exit 1
}

npx --yes supabase@latest db query --file "$FRONTEND_DIR/supabase/seed.sql" > /tmp/noprazo-supabase-seed.log 2>&1 || {
  echo "Falha ao aplicar o seed do Supabase local."
  cat /tmp/noprazo-supabase-seed.log
  exit 1
}

SUPABASE_STATUS="$(npx --yes supabase@latest status -o env)"
SUPABASE_URL="$(printf '%s\n' "$SUPABASE_STATUS" | sed -n 's/^API_URL="\(.*\)"$/\1/p')"
SUPABASE_ANON_KEY="$(printf '%s\n' "$SUPABASE_STATUS" | sed -n 's/^ANON_KEY="\(.*\)"$/\1/p')"
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Não foi possível obter a URL e a chave pública do Supabase local."
  exit 1
fi
SLA_API_KEY="$(python - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
)"

cat > "$BACKEND_DIR/.env" <<EOF
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable
SLA_API_KEY=$SLA_API_KEY
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=2
DB_POOL_TIMEOUT=10
DB_POOL_RECYCLE=1800
DB_CONNECT_TIMEOUT=10
EOF

cat > "$FRONTEND_DIR/.env.local" <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_BASE_PATH=/NoPrazo
NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
SUPABASE_AUTH_PROVIDER=email
API_INTERNAL_URL=http://127.0.0.1:8000
SLA_API_KEY=$SLA_API_KEY
EOF

(
  cd "$BACKEND_DIR"
  source "$VENV_DIR/bin/activate"
  uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

(
  cd "$FRONTEND_DIR"
  npm run dev -- --hostname 0.0.0.0
) &
FRONTEND_PID=$!

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" >/dev/null 2>&1 || true' EXIT

printf '\n\n========================================\n'
printf 'Supabase local em %s\n' "$SUPABASE_URL"
printf 'Frontend: http://localhost:3000/NoPrazo\n'
printf 'Backend: http://127.0.0.1:8000/health\n'
printf 'Login dev: solicitante@noprazo.local / solicitante123\n'
printf 'Login dev: resolvedor@noprazo.local / resolvedor123\n'
printf '========================================\n\n'

wait "$FRONTEND_PID"
