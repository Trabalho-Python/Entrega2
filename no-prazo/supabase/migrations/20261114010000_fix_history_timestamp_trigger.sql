DROP TRIGGER IF EXISTS historico_updates_ticket_timestamp ON public.historico_interacoes;
CREATE TRIGGER historico_updates_ticket_timestamp
AFTER INSERT ON public.historico_interacoes
FOR EACH ROW
WHEN (NEW.tipo = 'mensagem')
EXECUTE FUNCTION public.touch_ticket_on_history();