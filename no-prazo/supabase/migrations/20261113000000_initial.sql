-- NoPrazo: schema, status workflow, history, SLA pause, and row-level access.
-- Trusted roles are Supabase app_metadata claims set by an administrator.

DO $$
BEGIN
  CREATE TYPE public.status_chamado AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE public.prioridade_chamado AS ENUM ('baixa', 'media', 'alta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE public.status_chamado ADD VALUE IF NOT EXISTS 'aguardando';

CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS public.chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo varchar(255) NOT NULL,
  descricao text NOT NULL,
  status public.status_chamado NOT NULL DEFAULT 'aberto',
  prioridade public.prioridade_chamado NOT NULL,
  prazo_sla timestamptz,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
  resolvedor_id uuid REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  sla_pausado_em timestamptz,
  sla_pausado_total interval NOT NULL DEFAULT interval '0 seconds',
  idempotency_key uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.historico_interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  descricao text NOT NULL,
  tipo text NOT NULL DEFAULT 'mensagem' CHECK (tipo IN ('abertura', 'mensagem', 'status')),
  data_hora timestamptz NOT NULL DEFAULT now()
);

-- Forward-compatible additions for databases created from the original SQLAlchemy models.
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS resolvedor_id uuid REFERENCES public.usuarios(id) ON DELETE RESTRICT;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS sla_pausado_em timestamptz;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS sla_pausado_total interval NOT NULL DEFAULT interval '0 seconds';
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS idempotency_key uuid;
ALTER TABLE public.historico_interacoes ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'mensagem';
CREATE UNIQUE INDEX IF NOT EXISTS chamados_idempotency_key_uidx ON public.chamados(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_key ON public.usuarios(email);
CREATE UNIQUE INDEX IF NOT EXISTS categorias_nome_key ON public.categorias(nome);
CREATE INDEX IF NOT EXISTS chamados_usuario_created_idx ON public.chamados(usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chamados_resolvedor_status_idx ON public.chamados(resolvedor_id, status);
CREATE INDEX IF NOT EXISTS chamados_status_deadline_idx ON public.chamados(status, prazo_sla);
CREATE INDEX IF NOT EXISTS historico_chamado_data_idx ON public.historico_interacoes(chamado_id, data_hora);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.historico_interacoes'::regclass
      AND conname = 'historico_interacoes_tipo_check'
  ) THEN
    ALTER TABLE public.historico_interacoes
      ADD CONSTRAINT historico_interacoes_tipo_check
      CHECK (tipo IN ('abertura', 'mensagem', 'status'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chamados'::regclass AND conname = 'chamados_usuario_id_fkey'
  ) THEN
    ALTER TABLE public.chamados ADD CONSTRAINT chamados_usuario_id_fkey
      FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chamados'::regclass AND conname = 'chamados_categoria_id_fkey'
  ) THEN
    ALTER TABLE public.chamados ADD CONSTRAINT chamados_categoria_id_fkey
      FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chamados'::regclass AND conname = 'chamados_resolvedor_id_fkey'
  ) THEN
    ALTER TABLE public.chamados ADD CONSTRAINT chamados_resolvedor_id_fkey
      FOREIGN KEY (resolvedor_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.historico_interacoes'::regclass
      AND conname = 'historico_interacoes_chamado_id_fkey'
  ) THEN
    ALTER TABLE public.historico_interacoes ADD CONSTRAINT historico_interacoes_chamado_id_fkey
      FOREIGN KEY (chamado_id) REFERENCES public.chamados(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.historico_interacoes'::regclass
      AND conname = 'historico_interacoes_usuario_id_fkey'
  ) THEN
    ALTER TABLE public.historico_interacoes ADD CONSTRAINT historico_interacoes_usuario_id_fkey
      FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(COALESCE(NEW.email, NEW.id::text || '@no-prazo.invalid'), '@', 1)),
    COALESCE(NEW.email, NEW.phone || '@phone.no-prazo.invalid', NEW.id::text || '@no-prazo.invalid')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_no_prazo ON auth.users;
CREATE TRIGGER on_auth_user_created_no_prazo
AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
INSERT INTO public.usuarios (id, nome, email)
SELECT
  id,
  COALESCE(NULLIF(raw_user_meta_data ->> 'full_name', ''), NULLIF(raw_user_meta_data ->> 'name', ''), split_part(COALESCE(email, id::text || '@no-prazo.invalid'), '@', 1)),
  COALESCE(email, phone || '@phone.no-prazo.invalid', id::text || '@no-prazo.invalid')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

CREATE OR REPLACE FUNCTION public.handle_ticket_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid;
BEGIN
  actor_id := COALESCE(auth.uid(), NEW.resolvedor_id, NEW.usuario_id);
  NEW.updated_at := now();

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'aberto' AND NEW.status = 'em_andamento') OR
      (OLD.status = 'em_andamento' AND NEW.status IN ('aguardando', 'resolvido')) OR
      (OLD.status = 'aguardando' AND NEW.status IN ('em_andamento', 'resolvido')) OR
      (OLD.status = 'resolvido' AND NEW.status = 'fechado')
    ) THEN
      RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.status = 'aguardando' THEN
      NEW.sla_pausado_em := COALESCE(NEW.sla_pausado_em, now());
    ELSIF OLD.status = 'aguardando' AND OLD.sla_pausado_em IS NOT NULL THEN
      NEW.sla_pausado_total := OLD.sla_pausado_total + (now() - OLD.sla_pausado_em);
      IF OLD.prazo_sla IS NOT NULL THEN
        NEW.prazo_sla := OLD.prazo_sla + (now() - OLD.sla_pausado_em);
      END IF;
      NEW.sla_pausado_em := NULL;
    END IF;

    INSERT INTO public.historico_interacoes (chamado_id, usuario_id, descricao, tipo)
    VALUES (NEW.id, actor_id, OLD.status::text || ' → ' || NEW.status::text, 'status');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chamados_status_and_updated_at ON public.chamados;
CREATE TRIGGER chamados_status_and_updated_at
BEFORE UPDATE ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_update();

CREATE OR REPLACE FUNCTION public.handle_ticket_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.historico_interacoes (chamado_id, usuario_id, descricao, tipo)
  VALUES (NEW.id, NEW.usuario_id, 'Chamado aberto: ' || NEW.descricao, 'abertura');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chamados_initial_history ON public.chamados;
CREATE TRIGGER chamados_initial_history
AFTER INSERT ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_created();

CREATE OR REPLACE FUNCTION public.touch_ticket_on_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chamados SET updated_at = now() WHERE id = NEW.chamado_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS historico_updates_ticket_timestamp ON public.historico_interacoes;
CREATE TRIGGER historico_updates_ticket_timestamp
AFTER INSERT ON public.historico_interacoes
FOR EACH ROW EXECUTE FUNCTION public.touch_ticket_on_history();

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_interacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usuarios_read_authenticated ON public.usuarios;
CREATE POLICY usuarios_read_authenticated ON public.usuarios
FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS categorias_read_authenticated ON public.categorias;
CREATE POLICY categorias_read_authenticated ON public.categorias
FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS chamados_read_by_role ON public.chamados;
CREATE POLICY chamados_read_by_role ON public.chamados
FOR SELECT TO authenticated USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'solicitante' AND usuario_id = auth.uid()) OR
  auth.jwt() -> 'app_metadata' ->> 'role' = 'resolvedor'
);
DROP POLICY IF EXISTS chamados_insert_by_requester ON public.chamados;
CREATE POLICY chamados_insert_by_requester ON public.chamados
FOR INSERT TO authenticated WITH CHECK (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'solicitante' AND
  usuario_id = auth.uid() AND status = 'aberto' AND resolvedor_id IS NULL
);
DROP POLICY IF EXISTS chamados_update_by_resolver ON public.chamados;
CREATE POLICY chamados_update_by_resolver ON public.chamados
FOR UPDATE TO authenticated
USING (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'resolvedor' AND
  (resolvedor_id = auth.uid() OR resolvedor_id IS NULL)
)
WITH CHECK (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'resolvedor' AND resolvedor_id = auth.uid()
);
DROP POLICY IF EXISTS historico_read_by_ticket_role ON public.historico_interacoes;
CREATE POLICY historico_read_by_ticket_role ON public.historico_interacoes
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.chamados c
    WHERE c.id = chamado_id AND (
      (auth.jwt() -> 'app_metadata' ->> 'role' = 'solicitante' AND c.usuario_id = auth.uid()) OR
      auth.jwt() -> 'app_metadata' ->> 'role' = 'resolvedor'
    )
  )
);
DROP POLICY IF EXISTS historico_insert_by_participant ON public.historico_interacoes;
CREATE POLICY historico_insert_by_participant ON public.historico_interacoes
FOR INSERT TO authenticated WITH CHECK (
  tipo = 'mensagem' AND usuario_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chamados c
    WHERE c.id = chamado_id AND (
      (auth.jwt() -> 'app_metadata' ->> 'role' = 'solicitante' AND c.usuario_id = auth.uid() AND c.status NOT IN ('resolvido', 'fechado')) OR
      (auth.jwt() -> 'app_metadata' ->> 'role' = 'resolvedor' AND c.resolvedor_id = auth.uid() AND c.status <> 'fechado')
    )
  )
);

REVOKE ALL ON public.usuarios, public.categorias, public.chamados, public.historico_interacoes FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, nome) ON public.usuarios TO authenticated;
GRANT SELECT ON public.categorias TO authenticated;
GRANT SELECT ON public.chamados TO authenticated;
GRANT INSERT (titulo, descricao, prioridade, usuario_id, categoria_id, idempotency_key) ON public.chamados TO authenticated;
GRANT UPDATE (status, resolvedor_id) ON public.chamados TO authenticated;
GRANT SELECT ON public.historico_interacoes TO authenticated;
GRANT INSERT (chamado_id, usuario_id, descricao, tipo) ON public.historico_interacoes TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_ticket_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_ticket_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_ticket_on_history() FROM PUBLIC, anon, authenticated;
