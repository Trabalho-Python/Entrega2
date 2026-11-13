BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = extensions, public, auth;
SELECT plan(10);

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.usuarios'::regclass), 'RLS enabled on usuarios');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.categorias'::regclass), 'RLS enabled on categorias');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.chamados'::regclass), 'RLS enabled on chamados');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.historico_interacoes'::regclass), 'RLS enabled on historico_interacoes');

SELECT has_policy('public', 'usuarios', 'usuarios_read_authenticated');
SELECT has_policy('public', 'categorias', 'categorias_read_authenticated');
SELECT has_policy('public', 'chamados', 'chamados_read_by_role');
SELECT has_policy('public', 'chamados', 'chamados_insert_by_requester');
SELECT has_policy('public', 'chamados', 'chamados_update_by_resolver');
SELECT has_policy('public', 'historico_interacoes', 'historico_insert_by_participant');

SELECT * FROM finish();
ROLLBACK;
