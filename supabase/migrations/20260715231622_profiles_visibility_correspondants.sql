-- Les écrans de messagerie affichent le nom de l'expéditeur/des destinataires
-- via des jointures PostgREST vers profiles (expediteur:expediteur_id(...)),
-- qui respectent la RLS de profiles. Sans cette policy, un élève ne verrait
-- aucun nom pour un message reçu de/envoyé à quelqu'un avec qui il n'a pas
-- de relation "classique" (direction, prof sans cours en commun, etc.) —
-- le nom resterait vide même si le message lui-même est bien visible.
-- Pas de récursion : messages_select/destinataires_select ne dépendent pas
-- de profiles, donc aucun cycle en ajoutant cette policy sur profiles.
create policy profiles_select_correspondant on profiles for select
  using (
    exists (
      select 1 from message_destinataires md
      join messages m on m.id = md.message_id
      where (m.expediteur_id = profiles.id and md.destinataire_id = auth.uid())
         or (md.destinataire_id = profiles.id and m.expediteur_id = auth.uid())
    )
  );
