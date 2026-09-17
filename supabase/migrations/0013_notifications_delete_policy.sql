-- Oubliée dans la migration 0010 : sans policy DELETE, un utilisateur ne
-- peut même pas supprimer ses propres notifications (RLS bloque tout DELETE
-- par défaut en l'absence de policy — la requête "réussit" silencieusement
-- sans rien supprimer, ce qui a été repéré en écrivant le script de test).
create policy notifications_delete_own on public.notifications
  for delete using (destinataire_id = auth.uid());
