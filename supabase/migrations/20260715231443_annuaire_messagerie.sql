-- La messagerie est ouverte entre tous les rôles d'un établissement, mais
-- la table profiles reste restreinte par relation (self/direction/prof de
-- la classe/parent lié) pour les écrans d'administration — un élève n'a
-- donc aucun moyen de lister les autres membres de l'établissement pour
-- choisir un destinataire. Fonction dédiée, minimale (pas d'email exposé),
-- réservée à cet usage.
create function annuaire_etablissement() returns table(id uuid, nom text, prenom text, role role_utilisateur)
  language sql stable security definer set search_path = public as $$
  select id, nom, prenom, role
  from profiles
  where etablissement_id = current_etablissement_id() and actif = true and id <> auth.uid()
  order by nom
$$;
