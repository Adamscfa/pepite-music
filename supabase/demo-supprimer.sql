-- Pépite : efface les membres de démonstration créés par 06-comptes-demo.sql.
-- À coller dans Supabase > SQL Editor > Run, quand tu n'en as plus besoin.
--
-- Supprime leurs comptes, et avec eux leurs avis, commentaires, « j'aime »,
-- réactions, abonnements et votes. Attention : les commentaires que de vrais
-- membres auraient laissés SOUS un avis de démo partent aussi.
-- Les vrais membres et leurs propres avis ne sont pas touchés.

delete from auth.users
where id in (select id from public.profiles where is_demo);
