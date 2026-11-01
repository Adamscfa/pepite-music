-- Pépite : messages et notifications en direct, sans rafraîchir la page.
-- À coller une seule fois dans Supabase > SQL Editor > Run.
--
-- Supabase prévient alors le site dès qu'un message ou une notification arrive.
-- Les règles de sécurité restent les mêmes : chacun ne reçoit que ses propres
-- messages et notifications.

alter publication supabase_realtime add table public.messages, public.notifications;
