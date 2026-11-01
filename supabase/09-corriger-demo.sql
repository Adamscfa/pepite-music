-- Pépite : retire l'étiquette « Démo » des vrais membres.
-- À coller dans Supabase > SQL Editor > Run (sans risque, autant de fois que nécessaire).
--
-- Seuls les 8 membres imaginaires de 06-comptes-demo.sql doivent être « Démo » :
-- leurs identifiants commencent tous par de300000-. Tous les autres redeviennent normaux.

update public.profiles
set is_demo = false
where is_demo and id::text not like 'de300000-%';

-- Pour te mettre administrateur, remplace « ton_pseudo » par ton pseudo, puis exécute aussi :
-- update public.profiles set is_admin = true where username = 'ton_pseudo';
