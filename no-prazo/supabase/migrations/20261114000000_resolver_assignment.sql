ALTER TABLE public.historico_interacoes
  DROP CONSTRAINT IF EXISTS historico_interacoes_tipo_check;
ALTER TABLE public.historico_interacoes
  ADD CONSTRAINT historico_interacoes_tipo_check
  CHECK (tipo IN ('abertura', 'mensagem', 'status', 'atribuicao'));

CREATE OR REPLACE FUNCTION public.list_resolvers()
RETURNS TABLE (id uuid, nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT profile.id, profile.nome
  FROM auth.users AS auth_user
  JOIN public.usuarios AS profile ON profile.id = auth_user.id
  WHERE auth.jwt() -> 'app_metadata' ->> 'role' = 'resolvedor'
    AND auth_user.raw_app_meta_data ->> 'role' = 'resolvedor'
  ORDER BY profile.nome;
$$;

CREATE OR REPLACE FUNCTION public.assign_ticket(
  p_ticket_id uuid,
  p_resolver_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_id uuid := auth.uid();
  ticket_status public.status_chamado;
  previous_resolver_id uuid;
  target_name text;
BEGIN
  IF actor_id IS NULL OR auth.jwt() -> 'app_metadata' ->> 'role' <> 'resolvedor' THEN
    RAISE EXCEPTION 'Apenas resolvedores podem atribuir chamados.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT status, resolvedor_id
  INTO ticket_status, previous_resolver_id
  FROM public.chamados
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chamado não encontrado.' USING ERRCODE = 'no_data_found';
  END IF;

  IF ticket_status IN ('resolvido', 'fechado') THEN
    RAISE EXCEPTION 'Chamados resolvidos ou fechados não podem ser atribuídos.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT profile.nome
  INTO target_name
  FROM auth.users AS auth_user
  JOIN public.usuarios AS profile ON profile.id = auth_user.id
  WHERE auth_user.id = p_resolver_id
    AND auth_user.raw_app_meta_data ->> 'role' = 'resolvedor';

  IF target_name IS NULL THEN
    RAISE EXCEPTION 'O responsável selecionado não é um resolvedor válido.'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF previous_resolver_id = p_resolver_id THEN
    RETURN true;
  END IF;

  UPDATE public.chamados
  SET resolvedor_id = p_resolver_id
  WHERE id = p_ticket_id;

  INSERT INTO public.historico_interacoes (chamado_id, usuario_id, descricao, tipo)
  VALUES (p_ticket_id, actor_id, 'Chamado atribuído para ' || target_name, 'atribuicao');

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.list_resolvers() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assign_ticket(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_resolvers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_ticket(uuid, uuid) TO authenticated;